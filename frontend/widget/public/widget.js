(function() {
  const script = document.createElement("script");

  //กำหนดเองว่าต้องโหลดจากที่ไหน (แก้ตรงนี้ได้เลย)
  script.src = "http://localhost:3000/widget-bundle.js";  // ใช้ Localhost

  document.body.appendChild(script);
})();
