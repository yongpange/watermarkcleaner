// 检查数据库实际的列名
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('Checking wmc_users table columns...\n');
  
  // 查询一条记录来查看列名
  const { data, error } = await supabase
    .from('wmc_users')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('实际的数据库列名:');
    console.log('==================');
    Object.keys(data[0]).forEach((key, index) => {
      console.log(`${index + 1}. ${key}`);
    });
  } else {
    console.log('表中没有数据，无法查看列名');
    console.log('请先创建一个测试用户');
  }
}

checkColumns().catch(console.error);

