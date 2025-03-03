// const API_BASE = "https://beverest.thaibev.com/satisfaction/";
    (function () {
                console.log("✅ Widget Loaded! (ระบบจะตรวจสอบ Feedback และแสดง Modal ตามกำหนด)");
            
                function getUserId() {
                    return localStorage.getItem("web-portal-employee-id") || null;
                }
            
                async function getUserFeedbackStatus() {
                    const user_id = getUserId();
                    if (!user_id) {
                        console.log("❌ ไม่มี `user_id` ตรวจสอบไม่ได้");
                        return { hasFeedback: false, lastDismissTime: null };
                    }
            
                    try {
                        const response = await fetch(`https://user-satisfaction.onrender.com/${user_id}`, {
                            headers: { "Referer": window.location.origin }
                        });
                        const data = await response.json();
                console.log("📡 API Response:\n" +
                `-hasFeedback: ${data.hasFeedback}\n` +
                `-message: ${data.message}\n` +
                `-lastDismissTime: ${data.lastDismissTime}\n` +
                `-App Id: ${data.app_id}`);
                        return data;
                    } catch (error) {
                        console.error("❌ ตรวจสอบ Feedback ไม่สำเร็จ:", error);
                        return { hasFeedback: false, lastDismissTime: null };
                    }
                }
            
                async function showModal() {
                    const { hasFeedback } = await getUserFeedbackStatus();
                    if (hasFeedback) {
                        console.log("✅ ผู้ใช้ให้คะแนนแล้ว ไม่ต้องแสดง Modal");
                        return;
                    }
            
                    console.log("🛑 แสดง Modal ให้ผู้ใช้ให้คะแนน");
            
                    const overlay = document.createElement("div");
                    overlay.id = "feedback-overlay";
                    overlay.style = `
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: rgba(0, 0, 0, 0.5); z-index: 999; display: flex;
                        align-items: center; justify-content: center;
                        padding: 10px;
                    `;
            
                    const modal = document.createElement("div");
                    modal.style = `
                        background: white; padding: 20px; max-width: 450px; width: 90%;
                        box-shadow: 0px 5px 15px rgba(0,0,0,0.3);
                        border-radius: 12px; text-align: center;
                        font-family: Arial, sans-serif;
                    `;
                    modal.innerHTML = `
                        <h2 style="font-size: 20px; color: #333;">โปรดให้คะแนนความพึงพอใจของระบบ 😊🙏</h2>
                        <p style="color: gray; font-size: 14px;">(Please rate your satisfaction with the system.)</p>
                        <div id="star-rating" style="font-size: 40px; margin: 15px 0;">
                            <span class="star" data-value="1">☆</span>
                            <span class="star" data-value="2">☆</span>
                            <span class="star" data-value="3">☆</span>
                            <span class="star" data-value="4">☆</span>
                            <span class="star" data-value="5">☆</span>
                        </div>
                        <textarea id="comment" placeholder="บอกอะไรเราเพิ่มเติมได้นะครับ ✨" 
                            style="width: 90%; height: 80px; border-radius: 6px; padding: 10px; border: 1px solid #ccc; font-size: 14px;"></textarea>
                        <br>
                        <button id="submit-feedback" style="background: #28a745; color: white; padding: 12px; border: none; border-radius: 6px; margin-top: 12px; font-size: 16px; cursor: pointer; width: 90%;">ส่ง</button>
                        <button id="close-modal" style="background: #6c757d; color: white; padding: 12px; border: none; border-radius: 6px; margin-top: 10px; font-size: 16px; cursor: pointer; width: 90%;">ไว้คราวหลัง</button>
                    `;
            
                    overlay.appendChild(modal);
                    document.body.appendChild(overlay);
            
                    let selectedRating = 0;
                    const stars = modal.querySelectorAll(".star");
            
                    function highlightStars(rating) {
                        stars.forEach(star => {
                            star.textContent = parseInt(star.getAttribute("data-value")) <= rating ? "★" : "☆";
                            star.style.color = parseInt(star.getAttribute("data-value")) <= rating ? "gold" : "gray";
                        });
                    }
            
                    stars.forEach(star => {
                        star.style.cursor = "pointer";
                        star.style.transition = "color 0.2s ease";
                        star.addEventListener("click", function () {
                            selectedRating = parseInt(this.getAttribute("data-value"));
                            highlightStars(selectedRating);
                            console.log("⭐ Selected Rating:", selectedRating);
                        });
                    });
            
                    document.getElementById("close-modal").addEventListener("click", async () => {
                        overlay.remove();
            
                        const user_id = getUserId();
                        if (!user_id) return;

                        const {  app_id } = await getUserFeedbackStatus();

                        if (!app_id) {
                        console.error("❌ ไม่พบ `app_id` จาก API ไม่สามารถบันทึกเวลาได้");
                        return;
                        }
                        console.log("🔄 บันทึกเวลา last_dismiss_time...");
                        await fetch("https://user-satisfaction.onrender.com/api/feedback", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ user_id, app_id }) // ✅ ใช้ `app_id` จาก API
                        });
                    });
            
                    document.getElementById("submit-feedback").addEventListener("click", async () => {
                        if (selectedRating === 0) {
                            alert("กรุณาให้คะแนนก่อนส่ง");
                            return;
                        }
            
                        const user_id = getUserId();
                        if (!user_id) {
                            console.error("❌ ไม่พบ `user_id` ใน localStorage['web-portal-employee-id']");
                            return;
                        }
            
                        const comment = document.getElementById("comment").value;
                        const referrer = window.location.origin;
            
                        console.log("📤 ส่ง Feedback:", { user_id, rating: selectedRating, comment, referrer });
            
                        const response = await fetch("https://user-satisfaction.onrender.com/api/feedback", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ user_id, rating: selectedRating, comment, referrer })
                        });
            
                        if (response.ok) {
                            alert("✅ ขอบคุณสำหรับการประเมิน!");
                            overlay.remove();
                        } else {
                            alert("❌ มีข้อผิดพลาด กรุณาลองใหม่!");
                        }
                    });
                }
            
                async function initFeedbackCheck() {
                    console.log("⏳ ตรวจสอบ Feedback...");
            
                    const user_id = getUserId();
                    if (!user_id) {
                        console.log("❌ ยังไม่มี `user_id` รอ Login...");
                        return;
                    }
            
                    const { hasFeedback, lastDismissTime } = await getUserFeedbackStatus();
            
                    if (hasFeedback) {
                        console.log("✅ ผู้ใช้ให้คะแนนแล้ว ไม่ต้องแสดง Modal");
                        return;
                    }
            
                    if (lastDismissTime) {
                        const dismissTime = new Date(lastDismissTime).getTime();  
                        const nowLocal = new Date().getTime();
                        const nextShowTime = dismissTime + (23 * 60 * 60 * 1000); // +23 ชั่วโมง
                    
                        console.log(`- dismissTime: ${dismissTime}`, new Date(dismissTime).toString());
                        console.log(`- now (Local): ${nowLocal}`, new Date(nowLocal).toString());
                        console.log(`- nextShowTime: ${nextShowTime}`, new Date(nextShowTime).toString());
                    
                        if (nowLocal < nextShowTime) {
                            const remainingTime = Math.ceil((nextShowTime - nowLocal) / 1000);
                            console.log(`⏳ Modal จะเปิดอีกใน ${remainingTime} วินาที`);
                            setTimeout(showModal, remainingTime * 1000);
                            return;
                        }
                    }
                    
                    
                    
            
                    console.log("⏳ รอ 30 วิก่อนแสดง Feedback...");
                    setTimeout(showModal, 30 * 1000);
                }
            
                initFeedbackCheck();
            })();
            
