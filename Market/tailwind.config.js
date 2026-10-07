/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors:{
        primary:{
          DEFAULT:"#1DB954",
          light:"#1ED760",
          dark:"#1AA34A"
        },
        background:{
          DEFAULT:"#121212",
          light:"#181818",
          lighter:"#282828"
        },
        surface:{
          DEFAULT:"#282828",
          light:"#3E3E3E",
        },
        text:{
          primary:"#ffffff",
          secondary:"#E5E5E5",
          tertiary:"#6A6A6A",
        },
        accent:{ // Fixed typo here (added 't')
          DEFAULT:"#1DB954",
          red:"#F44336",
          yellow:"#FFC107",
        },
      }
    },
  },
  plugins: [],
}


