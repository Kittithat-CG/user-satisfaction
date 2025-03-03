(function() {
  const script = document.createElement("script");

  //กำหนดเองว่าต้องโหลดจากที่ไหน (แก้ตรงนี้ได้เลย)
  script.src = "https://user-satisfaction.onrender.com";
  // script.src = "http://localhost:3000/widget-bundle.js";  // ใช้ Localhost
  // script.src = "https://beverest.thaibev.com/satisfaction/widget-bundle.js";  // ใช้ Production

  document.body.appendChild(script);
})();
