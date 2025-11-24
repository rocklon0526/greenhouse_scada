/** @type {import('tailwindcss').Config} */
module.exports = {
  // 關鍵：請確認這行路徑是否完全正確
  // 必須包含 ./src 且副檔名要涵蓋 js, jsx
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}