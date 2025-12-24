#!/usr/bin/env node

import http from 'http';

// 配置
const TIMEOUT = 3000; // 3秒超时
const FRONTEND_URL = 'http://localhost:20001/';
const BACKEND_URL = 'http://localhost:20002/api/meta';

/**
 * 发起 HTTP GET 请求（带超时）
 */
function httpGet(url, timeout) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: timeout,
      headers: {
        'Accept': 'text/html,application/json,*/*',
        'User-Agent': 'HealthCheck/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: body
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

/**
 * 检查前端
 */
async function checkFrontend() {
  try {
    const result = await httpGet(FRONTEND_URL, TIMEOUT);
    
    // 判断：200 且 body 非空
    if (result.statusCode === 200 && result.body.length > 0) {
      return { success: true, message: 'OK' };
    } else {
      return { 
        success: false, 
        message: `HTTP ${result.statusCode} or empty body` 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: error.message === 'timeout' ? 'timeout' : error.code || 'error' 
    };
  }
}

/**
 * 检查后端
 */
async function checkBackend() {
  try {
    const result = await httpGet(BACKEND_URL, TIMEOUT);
    
    // 判断：200 且返回 JSON 含 today 字段
    if (result.statusCode === 200) {
      try {
        const json = JSON.parse(result.body);
        if (json.today) {
          return { success: true, message: 'OK' };
        } else {
          return { success: false, message: 'missing "today" field' };
        }
      } catch (e) {
        return { success: false, message: 'invalid JSON' };
      }
    } else {
      return { success: false, message: `HTTP ${result.statusCode}` };
    }
  } catch (error) {
    return { 
      success: false, 
      message: error.message === 'timeout' ? 'timeout' : error.code || 'error' 
    };
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 Health Check Starting...\n');

  // 并发检查前端和后端
  const [frontendResult, backendResult] = await Promise.all([
    checkFrontend(),
    checkBackend()
  ]);

  // 输出前端结果
  const frontendIcon = frontendResult.success ? '🟢' : '🔴';
  const frontendStatus = frontendResult.success 
    ? frontendResult.message 
    : `FAILED (${frontendResult.message})`;
  console.log(`${frontendIcon} Frontend ${FRONTEND_URL} ${frontendStatus}`);

  // 输出后端结果
  const backendIcon = backendResult.success ? '🟢' : '🔴';
  const backendStatus = backendResult.success 
    ? backendResult.message 
    : `FAILED (${backendResult.message})`;
  console.log(`${backendIcon} Backend  ${BACKEND_URL} ${backendStatus}`);

  // 汇总
  console.log();
  if (frontendResult.success && backendResult.success) {
    console.log('✅ All good.');
    process.exit(0);
  } else {
    console.log('❌ Some services failed.');
    process.exit(1);
  }
}

// 运行
main();
