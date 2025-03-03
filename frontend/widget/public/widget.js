(function() {
  const script = document.createElement("script");

  //กำหนดเองว่าต้องโหลดจากที่ไหน
  script.src = "http://localhost:3000/widget-bundle.js";  // ใช้ Localhost

  document.body.appendChild(script);
})();
