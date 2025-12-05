#!/usr/bin/env tsx
/**
 * Chat Session Insert Test Script
 * 
 * This script tests the chat_sessions table insert operation
 * to verify that the Drizzle configuration fix works correctly.
 * 
 * Usage: npx tsx scripts/test-chat-session-insert.ts
 */

import "dotenv/config";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { randomUUID } from "crypto";
import * as schema from "../src/db/schema";

// Load environment variables
config({ path: ".env" });
config({ path: ".env.development" });
config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

async function testChatSessionInsert() {
  console.log("🧪 Testing Chat Session Insert Operation...\n");

  // Check if DATABASE_URL is set
  if (!DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL is not set in environment variables");
    console.error("Please check your .env.local file\n");
    process.exit(1);
  }

  // Mask password in URL for display
  const maskedUrl = DATABASE_URL.replace(
    /(:\/\/[^:]+:)([^@]+)(@)/,
    "$1****$3"
  );
  console.log(`📡 Database URL: ${maskedUrl}\n`);

  let client: postgres.Sql | null = null;

  try {
    // Create postgres client
    console.log("⏳ Connecting to database...");
    client = postgres(DATABASE_URL, {
      prepare: false,
      max: 1,
      connect_timeout: 10,
      ssl: "require",
    });

    const db = drizzle(client);
    console.log("✅ Connection established!\n");

    // Test data
    const testFileId = `test-${Date.now()}`;
    const testUuid = randomUUID();
    const testMessages = [
      {
        role: "user" as const,
        content: "Hello, this is a test message",
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant" as const,
        content: "This is a test response",
        timestamp: new Date().toISOString(),
      },
    ];

    console.log("📝 Test Data:");
    console.log(`   UUID: ${testUuid}`);
    console.log(`   File ID: ${testFileId}`);
    console.log(`   Messages: ${testMessages.length} messages\n`);

    // Insert test chat session
    console.log("⏳ Inserting test chat session...");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    await db.insert(schema.chatSessions).values({
      uuid: testUuid,
      user_uuid: null, // Anonymous user
      file_id: testFileId,
      messages: testMessages as unknown[],
      created_at: now,
      updated_at: now,
      expires_at: expiresAt,
      message_count: testMessages.length,
      last_message_at: new Date(testMessages[testMessages.length - 1].timestamp),
    });

    console.log("✅ Insert successful!\n");

    // Verify the insert
    console.log("⏳ Verifying insert...");
    const result = await db
      .select()
      .from(schema.chatSessions)
      .where(schema.chatSessions.uuid.eq(testUuid))
      .limit(1);

    if (result.length === 0) {
      console.error("❌ ERROR: Insert verification failed - no data found");
      process.exit(1);
    }

    console.log("✅ Verification successful!\n");
    console.log("📊 Inserted Data:");
    console.log(`   UUID: ${result[0].uuid}`);
    console.log(`   File ID: ${result[0].file_id}`);
    console.log(`   Message Count: ${result[0].message_count}`);
    console.log(`   Created At: ${result[0].created_at}`);
    console.log(`   Expires At: ${result[0].expires_at}\n`);

    // Clean up test data
    console.log("⏳ Cleaning up test data...");
    await db
      .delete(schema.chatSessions)
      .where(schema.chatSessions.uuid.eq(testUuid));

    console.log("✅ Cleanup successful!\n");

    console.log("🎉 All tests passed!");
    console.log("✅ Drizzle configuration is working correctly");
    console.log("✅ Chat session insert operation is functional\n");

  } catch (error) {
    console.error("\n❌ ERROR:", (error as Error).message);
    console.error("\n📋 Full Error Details:");
    console.error(error);

    if ((error as Error).message.includes("relation") && (error as Error).message.includes("does not exist")) {
      console.error("\n💡 Troubleshooting:");
      console.error("   - The chat_sessions table does not exist in the database");
      console.error("   - Run: Execute create_all_tables.sql in Supabase SQL Editor");
      console.error("   - Or run: pnpm db:push\n");
    } else if ((error as Error).message.includes("row-level security policy")) {
      console.error("\n💡 Troubleshooting:");
      console.error("   - RLS policy is blocking the insert");
      console.error("   - Run: Execute rls_all_tables.sql in Supabase SQL Editor\n");
    } else if ((error as Error).message.includes("password authentication failed")) {
      console.error("\n💡 Troubleshooting:");
      console.error("   - Check if your database password is correct");
      console.error("   - Verify the password in .env.local\n");
    }

    process.exit(1);
  } finally {
    // Close connection
    if (client) {
      await client.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run the test
testChatSessionInsert();

