// Tailwind v2.2.19 构建配置（生成 public/tailwind-class.css）
// 重新生成命令：npx tailwindcss@2.2.19 -c tailwind.config.js -o public/tailwind-class.css --minify
// 注意：新增 Tailwind 类后需重新执行上述命令，否则新类不会生效
module.exports = {
  darkMode: 'class', // 深色模式由 html 上的 .dark 类驱动（theme.js 控制）
  mode: 'jit',
  purge: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  safelist: [
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    'grid-cols-5',
    'grid-cols-6',
    'grid-cols-7',
    'grid-cols-8',
    'dark:bg-gray-700',
    'dark:bg-gray-800',
    'dark:bg-gray-900',
    'dark:text-gray-100',
    'dark:text-gray-200',
    'dark:text-gray-300',
    'dark:text-gray-400',
    'dark:hover:bg-gray-600',
    'dark:hover:bg-gray-700',
    'dark:border-gray-600',
    'dark:border-gray-700',
    'dark:shadow-lg',
    'dark:bg-blue-900',
    'dark:text-purple-400',
    'dark:text-blue-400'
  ],
  theme: {
    extend: {}
  }
}
