import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:18081' } },
  build: {
    // 图表引擎独立缓存，应用代码和数据更新不必重新下载全部组件库。
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'charts', test: /node_modules[\\/](?:@antv|@ant-design[\\/]plots)/, priority: 20 },
            { name: 'ui', test: /node_modules[\\/](?:antd|@ant-design|@rc-component|rc-|react|react-dom)/, priority: 10 },
          ],
        },
      },
    },
  },
});
