<template>
  <div class="h-screen flex flex-col">
    <div class="flex flex-1 overflow-hidden relative">
      <main class="flex-1 flex flex-col p-4 overflow-y-auto">
        <div class="flex-grow max-w-5xl mx-auto w-full">
          <h1 
            class="text-3xl font-bold mb-6 text-center text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors cursor-pointer"
            @click="$router.push('/')"
          >
            关于 Simple NAV
          </h1>
          <div class="prose dark:prose-invert">
            <div class="grid grid-cols-2 gap-6 mb-8">
              <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <i class="fas fa-rocket text-blue-500 text-xl mb-2"></i>
                <h3 class="text-xl font-semibold mb-2">项目简介</h3>
                <p class="text-gray-600 dark:text-gray-300">
                  一个简洁高效的导航站点，全AI开发，导航数据从维基云表格获取。以自己的使用习惯来开发。
                </p>
                <p> 
                  <a 
                    href="https://vika.cn/share/shrxaWuBbbn6cKWBwvXgV" 
                    target="_blank"
                    class="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 underline"
                  >
                    维基云表格地址
                  </a> |                   
                  <a 
                    href="https://vika.cn/workbench/fomWQp8Fd6lHE5CBKl/viwullRf3ubdS?fldM5GkwwsOFh=%2Fdefault.ico&fldXKVGVmpAnY=%E6%9D%82%E9%A1%B9%E5%B7%A5%E5%85%B7" 
                    target="_blank"
                    class="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 underline"
                  >
                    网站收录申请
                  </a>
                </p>
              </div>
              
              <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <i class="fas fa-code text-purple-500 text-xl mb-2"></i>
                <h3 class="text-xl font-semibold mb-2">技术栈</h3>
                <ul class="list-disc pl-4 text-gray-600 dark:text-gray-300">
                  <li>Vue 3 + Composition API</li>
                  <li>Tailwind CSS</li>
                  <li>Vue Router</li>
                  <li>Font Awesome</li>
                </ul>
              </div>
            </div>
            
            <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
              <i class="fas fa-star text-yellow-500 text-xl mb-2"></i>
              <h3 class="text-xl font-semibold mb-2">功能特点</h3>
              <ul class="list-disc pl-4 text-gray-600 dark:text-gray-300">
                <li>智能本地搜索功能</li>
                <li>响应式侧边栏布局</li>
                <li>黑暗模式自动适配</li>                  
                <li>多分类资源管理</li>
                <li>从维基云表格获取数据，无需数据库</li>
              </ul>
            </div>
            
            <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
              <i class="fas fa-user-circle text-red-500 text-xl mb-2"></i>
              <h3 class="text-xl font-semibold mb-2">关于作者</h3>
              <div class="text-gray-600 dark:text-gray-300 space-y-2">
                <p>🕴️ 开发者：水常（Shui Chang）</p>
                <p>🚀 带娃建筑师 | AI技术学习者 | 个人博主</p>
                <p>🏠 个人主页： 
                  <a 
                    href="https://www.shuichanga.cn" 
                    target="_blank"
                    class="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 underline"
                  >
                    水常&Shui Chang
                  </a>
                </p>
                <p>🌐 个人博客： 
                  <a 
                    href="https://blog.shuichanga.cn" 
                    target="_blank"
                    class="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 underline"
                  >
                    Rao's Blog
                  </a>
                </p>
                <p>💰 更多AI作品： 
                  <a 
                    href="https://shuichanga.cn" 
                    target="_blank"
                    class="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 underline"
                  >
                    访问我的个人网站
                  </a>                  
                </p>
              </div>
            </div>
            
            <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <i class="fas fa-chart-line text-green-500 text-xl mb-2"></i>
              <h3 class="text-xl font-semibold mb-2">数据统计</h3>
              <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div class="text-2xl font-bold text-blue-500">{{ websiteCount }}个</div>
                  <div class="text-sm text-gray-500">收录网站</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-purple-500">100%</div>
                  <div class="text-sm text-gray-500">可用性监测</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-green-500">{{ lastUpdateTime || '2025-12-17' }}</div>
                  <div class="text-sm text-gray-500">自动更新</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer class="mt-8" />
      </main>
    </div>
  </div>
</template>

<script>
import Footer from '../components/Footer.vue';
import { fetchData } from '../api/fetchData';

export default {
  components: { Footer },
  data() {
    return {
      websiteCount: 0,
      lastUpdateTime: ''
    }
  },
  async created() {
    try {
      const data = await fetchData();
      this.websiteCount = data.length;
      
      if (data.length > 0) {
        const recordsWithUpdateTime = data.filter(item => item.updatedAt);
        if (recordsWithUpdateTime.length > 0) {
          const latestRecord = recordsWithUpdateTime.reduce((latest, current) => {
            return new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest;
          });
          this.lastUpdateTime = new Date(latestRecord.updatedAt).toISOString().split('T')[0];
        }
      }
    } catch (error) {
      this.websiteCount = 0;
    }
  }
}
</script>
