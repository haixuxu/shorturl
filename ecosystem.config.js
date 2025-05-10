module.exports = {
  apps: [{
    name: 'shorturl',
    script: 'app.js',
    instances: 'max', // 根据 CPU 核心数自动扩展
    exec_mode: 'cluster', // 使用集群模式
    watch: false, // 生产环境禁用文件监视
    max_memory_restart: '1G', // 内存超过 1G 时重启
    env: {
        // 环境参数，当前指定为生产环境 process.env.NODE_ENV
        NODE_ENV: 'production',
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true, // 添加时间戳到日志
    merge_logs: true, // 合并集群日志
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z' // 日志时间格式
  }]
}; 