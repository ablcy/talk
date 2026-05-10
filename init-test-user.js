// 初始化数据库并创建测试账户
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DATABASE_URL = 'postgresql://xata:xIpmyAjz9I0Hb3rWE6m2MYDyUMCmc9hY2rnPgfoi6eejjwGlN9KuXrLfVmbHnsG2@ma8pq7vand7rv3dvpeaa1kdbog.us-east-1.xata.tech/xata?sslmode=require';

console.log('🚀 Initializing database and creating test users...');

async function main() {
    if (!DATABASE_URL) {
        console.log('❌ No database URL configured');
        return;
    }

    let pool;
    
    try {
        const { Pool } = require('pg');
        pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();
        console.log('✅ Database connection successful');
        
        // 创建表结构
        console.log('📊 Creating database tables...');
        
        // Users 表
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                avatar TEXT,
                nickname TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created');
        
        // Friendships 表
        await client.query(`
            CREATE TABLE IF NOT EXISTS friendships (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                friend_id TEXT NOT NULL,
                UNIQUE(user_id, friend_id)
            )
        `);
        console.log('✅ Friendships table created');
        
        // Messages 表
        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                sender_id TEXT NOT NULL,
                receiver_id TEXT NOT NULL,
                content TEXT NOT NULL,
                type TEXT DEFAULT 'text',
                time TEXT NOT NULL,
                timestamp BIGINT NOT NULL,
                read BOOLEAN DEFAULT FALSE
            )
        `);
        console.log('✅ Messages table created');
        
        // Groups 表
        await client.query(`
            CREATE TABLE IF NOT EXISTS "groups" (
                id TEXT PRIMARY KEY,
                group_number TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                avatar TEXT,
                owner_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Groups table created');
        
        // Group members 表
        await client.query(`
            CREATE TABLE IF NOT EXISTS group_members (
                id SERIAL PRIMARY KEY,
                group_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT DEFAULT 'member',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(group_id, user_id)
            )
        `);
        console.log('✅ Group members table created');
        
        // Group messages 表
        await client.query(`
            CREATE TABLE IF NOT EXISTS group_messages (
                id TEXT PRIMARY KEY,
                group_id TEXT NOT NULL,
                sender_id TEXT NOT NULL,
                content TEXT NOT NULL,
                type TEXT DEFAULT 'text',
                time TEXT NOT NULL,
                timestamp BIGINT NOT NULL
            )
        `);
        console.log('✅ Group messages table created');
        
        // 创建测试账户1
        console.log('👤 Creating test user 1...');
        
        const testUser1 = {
            id: uuidv4(),
            username: 'test1',
            password: await bcrypt.hash('123456', 10),
            avatar: null,
            nickname: '测试用户1'
        };
        
        try {
            await client.query(
                'INSERT INTO users (id, username, password, avatar, nickname) VALUES ($1, $2, $3, $4, $5)',
                [testUser1.id, testUser1.username, testUser1.password, testUser1.avatar, testUser1.nickname]
            );
            console.log('✅ Test user 1 created successfully!');
        } catch (e) {
            if (e.code === '23505') {
                console.log('ℹ️  Test user 1 already exists');
            } else {
                throw e;
            }
        }
        
        // 创建测试账户2
        console.log('👤 Creating test user 2...');
        
        const testUser2 = {
            id: uuidv4(),
            username: 'test2',
            password: await bcrypt.hash('123456', 10),
            avatar: null,
            nickname: '测试用户2'
        };
        
        try {
            await client.query(
                'INSERT INTO users (id, username, password, avatar, nickname) VALUES ($1, $2, $3, $4, $5)',
                [testUser2.id, testUser2.username, testUser2.password, testUser2.avatar, testUser2.nickname]
            );
            console.log('✅ Test user 2 created successfully!');
        } catch (e) {
            if (e.code === '23505') {
                console.log('ℹ️  Test user 2 already exists');
            } else {
                throw e;
            }
        }
        
        // 查询用户ID
        const result1 = await client.query('SELECT id, username, nickname FROM users WHERE username = $1', ['test1']);
        const result2 = await client.query('SELECT id, username, nickname FROM users WHERE username = $1', ['test2']);
        
        const user1Id = result1.rows[0]?.id;
        const user2Id = result2.rows[0]?.id;
        
        // 建立好友关系
        if (user1Id && user2Id) {
            console.log('🤝 Creating friendship between test users...');
            try {
                await client.query(
                    'INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2)',
                    [user1Id, user2Id]
                );
                await client.query(
                    'INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2)',
                    [user2Id, user1Id]
                );
                console.log('✅ Friendship created successfully!');
            } catch (e) {
                if (e.code === '23505') {
                    console.log('ℹ️  Friendship already exists');
                } else {
                    throw e;
                }
            }
        }
        
        console.log('');
        console.log('🎉 数据库初始化成功！');
        console.log('');
        console.log('📋 测试账户信息：');
        console.log('');
        console.log('用户1：');
        console.log('   👤 用户名：test1');
        console.log('   🔑 密码：123456');
        console.log('   📝 昵称：测试用户1');
        console.log('   🆔 ID：', user1Id);
        console.log('');
        console.log('用户2：');
        console.log('   👤 用户名：test2');
        console.log('   🔑 密码：123456');
        console.log('   📝 昵称：测试用户2');
        console.log('   🆔 ID：', user2Id);
        console.log('');
        console.log('💡 测试方法：');
        console.log('   1. 使用 test1 登录');
        console.log('   2. 进入与 test2 的聊天界面');
        console.log('   3. 点击右上角三点按钮，开启阅后即焚');
        console.log('   4. 发送消息后退出聊天框');
        console.log('   5. 再次进入聊天，消息应该消失');
        console.log('   6. 刷新浏览器，阅后即焚设置应该保持开启');
        
        client.release();
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

main().catch(console.error);