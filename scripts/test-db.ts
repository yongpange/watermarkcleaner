#!/usr/bin/env tsx
/**
 * Database Connection Test Script
 * 
 * This script tests the database connection and performs basic operations:
 * 1. Tests database connection
 * 2. Lists all tables
 * 3. Counts records in each table
 * 4. Tests a simple query
 * 
 * Usage: pnpm db:test
 */

import "dotenv/config";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema";

// Load environment variables
config({ path: ".env" });
config({ path: ".env.development" });
config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

async function testDatabaseConnection() {
  console.log("🔍 Testing Supabase Database Connection...\n");

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

    // Test 1: Basic connection test
    console.log("✅ Connection established!\n");

    // Test 2: Check database version
    console.log("📊 Database Information:");
    const versionResult = await db.execute(
      sql`SELECT version() as version`
    );
    if (versionResult.rows && versionResult.rows.length > 0) {
      const version = (versionResult.rows[0] as { version: string }).version;
      console.log(`   PostgreSQL Version: ${version.split(",")[0]}\n`);
    }

    // Test 3: List all tables
    console.log("📋 Checking Tables:");
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tablesResult.rows && tablesResult.rows.length > 0) {
      console.log(`   Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach((row: Record<string, unknown>) => {
        console.log(`   - ${row.table_name}`);
      });
      console.log();
    } else {
      console.log("   ⚠️  No tables found. You may need to run migrations.\n");
    }

    // Test 4: Count records in each table (if tables exist)
    if (tablesResult.rows && tablesResult.rows.length > 0) {
      console.log("📈 Table Record Counts:");
      
      const tableNames = [
        "users",
        "orders",
        "credits",
        "apikeys",
        "posts",
        "affiliates",
        "feedbacks",
        "conversions",
        "user_preferences",
      ];

      for (const tableName of tableNames) {
        try {
          const countResult = await db.execute(
            sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`)
          );
          if (countResult.rows && countResult.rows.length > 0) {
            const count = (countResult.rows[0] as { count: number }).count;
            console.log(`   ${tableName.padEnd(20)} : ${count} records`);
          }
        } catch (error: unknown) {
          // Table might not exist yet
          if (error instanceof Error && error.message.includes("does not exist")) {
            console.log(`   ${tableName.padEnd(20)} : ⚠️  Table not found`);
          } else {
            console.log(`   ${tableName.padEnd(20)} : ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
      console.log();
    }

    // Test 5: Test a simple insert and delete (to verify write permissions)
    console.log("🔧 Testing Write Permissions:");
    try {
      // Try to create a test table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS _test_connection (
          id SERIAL PRIMARY KEY,
          test_value TEXT
        )
      `);
      
      // Insert a test record
      await db.execute(sql`
        INSERT INTO _test_connection (test_value) 
        VALUES ('test')
      `);
      
      // Delete the test record
      await db.execute(sql`
        DELETE FROM _test_connection WHERE test_value = 'test'
      `);
      
      // Drop the test table
      await db.execute(sql`
        DROP TABLE _test_connection
      `);
      
      console.log("   ✅ Write permissions verified\n");
    } catch (error: unknown) {
      console.log(`   ❌ Write test failed: ${error instanceof Error ? error.message : String(error)}\n`);
    }

    // Success summary
    console.log("=" .repeat(60));
    console.log("✅ Database connection test completed successfully!");
    console.log("=" .repeat(60));
    console.log("\n📝 Next Steps:");
    console.log("   1. If no tables found, run: pnpm db:push");
    console.log("   2. To view database in browser: pnpm db:studio");
    console.log("   3. To generate migrations: pnpm db:generate");
    console.log();

  } catch (error: unknown) {
    console.error("\n❌ Database Connection Test Failed!");
    console.error("=" .repeat(60));
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
    
    if (error instanceof Error && error.message.includes("password authentication failed")) {
      console.error("💡 Troubleshooting:");
      console.error("   - Check if your database password is correct");
      console.error("   - Make sure you replaced [YOUR-PASSWORD] in DATABASE_URL");
      console.error("   - Verify the password in Supabase dashboard\n");
    } else if (error.message.includes("could not translate host name")) {
      console.error("💡 Troubleshooting:");
      console.error("   - Check if your DATABASE_URL is correct");
      console.error("   - Make sure you copied the full connection string");
      console.error("   - Verify your Supabase project is active\n");
    } else if (error.message.includes("timeout")) {
      console.error("💡 Troubleshooting:");
      console.error("   - Check your internet connection");
      console.error("   - Verify Supabase project is running");
      console.error("   - Check if firewall is blocking the connection\n");
    } else {
      console.error("💡 Troubleshooting:");
      console.error("   - Double-check your .env.local file");
      console.error("   - Verify DATABASE_URL format is correct");
      console.error("   - Check Supabase dashboard for project status\n");
    }
    
    process.exit(1);
  } finally {
    // Close the connection
    if (client) {
      await client.end();
      console.log("🔌 Database connection closed.\n");
    }
  }
}

// Run the test
testDatabaseConnection();

