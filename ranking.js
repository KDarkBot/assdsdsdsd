// ranking.js

// Firebase 초기화
const firebaseConfig = {
    apiKey: "AIzaSyAXST1zO_7Rzal1nmkS6mcdib2L6LVbHC8",
    authDomain: "chatsystem1-b341f.firebaseapp.com",
    databaseURL: "https://chatsystem1-b341f-default-rtdb.firebaseio.com",
    projectId: "chatsystem1-b341f",
    storageBucket: "chatsystem1-b341f.appspot.com",
    messagingSenderId: "111851594752",
    appId: "1:111851594752:web:ab7955b9b052ba907c64e5",
    measurementId: "G-M14RE2SYWG",
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  // DOM 요소 가져오기
  const rankingList = document.getElementById("ranking-list");
  const goBackButton = document.getElementById("go-back-button");
  const rankingPeriodSelect = document.getElementById("ranking-period");
  const allRankingButton = document.querySelector('a[href="#"]'); // 전체 랭킹 버튼
  const monthlyRankingButton = document.querySelectorAll('a[href="#"]')[1]; // 월간 랭킹 버튼
  const weeklyRankingButton = document.querySelectorAll('a[href="#"]')[2]; // 주간 랭킹 버튼
  
  // 메인 페이지로 돌아가기
  goBackButton.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  
  // 랭킹 데이터를 가져오는 함수
  const fetchRankingData = async (period = "all") => {
    let query = db.collection("users").orderBy("points", "desc").limit(50);
  
    if (period === "month") {
      const startOfMonth = new Date(new Date().setDate(1));
      query = query.where("lastUpdated", ">=", startOfMonth);
    } else if (period === "week") {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      query = query.where("lastUpdated", ">=", startOfWeek);
    }
  
    const snapshot = await query.get();
    const rankingData = [];
  
    snapshot.forEach((doc) => {
      const data = doc.data();
      rankingData.push({
        name: data.name || "익명",
        points: data.points || 0,
        email: data.email || "",
      });
    });
  
    return rankingData;
  };
  
  // 랭킹 리스트 렌더링 함수
  const renderRankingList = (data) => {
    rankingList.innerHTML = "";
  
    if (data.length === 0) {
      rankingList.innerHTML = `
        <li class="text-gray-500 text-center py-4">
          랭킹 데이터가 없습니다.
        </li>
      `;
      return;
    }
  
    data.forEach((user, index) => {
      const listItem = document.createElement("li");
      listItem.classList.add("py-3", "sm:py-4");
  
      listItem.innerHTML = `
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0">
            <span class="inline-flex items-center justify-center w-10 h-10 bg-primary-500 text-white rounded-full text-lg font-semibold">
              ${index + 1}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              ${user.name}
            </p>
            <p class="text-sm text-gray-500 truncate">
              ${user.email}
            </p>
          </div>
          <div class="inline-flex items-center text-base font-semibold text-gray-900">
            ${user.points} P
          </div>
        </div>
      `;
  
      rankingList.appendChild(listItem);
    });
  };
  
  // 랭킹 데이터 로드 및 렌더링
  const loadRanking = async (period = "all") => {
    const rankingData = await fetchRankingData(period);
    renderRankingList(rankingData);
  };
  
  // 랭킹 버튼 이벤트 추가
  allRankingButton.addEventListener("click", (e) => {
    e.preventDefault();
    loadRanking("all");
    rankingPeriodSelect.value = "all";
  });
  
  monthlyRankingButton.addEventListener("click", (e) => {
    e.preventDefault();
    loadRanking("month");
    rankingPeriodSelect.value = "month";
  });
  
  weeklyRankingButton.addEventListener("click", (e) => {
    e.preventDefault();
    loadRanking("week");
    rankingPeriodSelect.value = "week";
  });
  
  // 기간 선택 변경 시 랭킹 다시 로드
  rankingPeriodSelect.addEventListener("change", () => {
    loadRanking(rankingPeriodSelect.value);
  });
  
  // 초기 로드
  loadRanking();
  