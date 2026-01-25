// Polyfills for browser environment
import process from 'process/browser';
import { Buffer } from 'buffer';

// 将 process 和 Buffer 注入到全局对象
window.process = process;
window.Buffer = Buffer;

// 设置默认环境变量
window.process.env = window.process.env || {};
window.process.env.NODE_ENV = window.process.env.NODE_ENV || 'production';
