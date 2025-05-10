const mongoose = require('mongoose');

// ✅ 使用 IPv4 地址连接，避免 ::1 问题
mongoose.connect('mongodb://127.0.0.1:27017/testdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 监听连接状态
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB 连接成功');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB 连接失败', err);
});

// 定义一个 schema 和 model
const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// 插入一个用户
async function run() {
  try {
    const user = new User({ name: 'Alice', age: 25 });
    const result = await user.save();
    console.log('✅ 用户已保存:', result);

    // 查询所有用户
    const users = await User.find();
    console.log('📋 当前用户列表:', users);
  } catch (err) {
    console.error('⚠️ 操作失败:', err);
  } finally {
    mongoose.disconnect();
  }
}

run();