// ranking.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Firebase 초기화
    const firebaseConfig = {
        apiKey: "AIzaSyAXST1zO_7Rzal1nmkS6mcdib2L6LVbHC8",
        authDomain: "chatsystem1-b341f.firebaseapp.com",
        databaseURL: "https://chatsystem1-b341f-default-rtdb.firebaseio.com",
        projectId: "chatsystem1-b341f",
        storageBucket: "chatsystem1-b341f.appspot.com",
        messagingSenderId: "111851594752",
        appId: "1:111851594752:web:ab7955b9b052ba907c64e5",
        measurementId: "G-M14RE2SYWG"
      };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
  
    // 2. "메인으로" 버튼 → index.html 이동
    const goBackButton = document.getElementById("go-back-button");
    goBackButton?.addEventListener("click", () => {
      // 메인 페이지로 돌아가기
      window.location.href = "index.html";
    });
  
    // 3. 랭킹 목록 불러오기 함수
    const loadRanking = async () => {
      try {
        // users 컬렉션에서 points 내림차순, 상위 10명
        const snapshot = await db.collection("users")
          .orderBy("points", "desc")
          .limit(10)
          .get();
  
        const rankingList = document.getElementById("ranking-list");
        rankingList.innerHTML = "";
  
        let rank = 1;
        snapshot.forEach(doc => {
          const user = doc.data();
          // user.name, user.points
          const li = document.createElement("li");
          li.className = "border p-2 rounded shadow-sm";
          li.textContent = `${rank++}위: ${user.name || "이름 없음"} - ${user.points || 0}점`;
          rankingList.appendChild(li);
        });
      } catch (err) {
        console.error("랭킹 불러오기 오류:", err);
        alert("랭킹을 불러오는 중 오류가 발생했습니다.");
      }
    };
  
    // 4. 페이지 로드 시 랭킹 불러오기
    loadRanking();
  });
  
