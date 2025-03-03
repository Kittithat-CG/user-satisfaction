import React, { useState } from "react";
import axios from "axios";

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    await axios.post("http://localhost:3000/feedback", {
      user_id: "12345",
      app_name: "Test App",
      rating,
      comment
    });
    setIsOpen(false);
  };

  return isOpen ? (
    <div className="modal">
      <h2>ให้คะแนนความพึงพอใจ</h2>
      <select onChange={(e) => setRating(Number(e.target.value))}>
        <option value="">เลือกคะแนน</option>
        {[1, 2, 3, 4, 5].map((num) => (
          <option key={num} value={num}>{num}</option>
        ))}
      </select>
      <textarea placeholder="แสดงความคิดเห็น..." onChange={(e) => setComment(e.target.value)} />
      <button onClick={handleSubmit}>ส่ง</button>
    </div>
  ) : null;
};

export default FeedbackWidget;
