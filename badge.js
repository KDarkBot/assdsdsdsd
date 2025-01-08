
document.addEventListener("DOMContentLoaded", () => {
    // Firebase 초기화
    const firebaseConfig = {
        apiKey: "AIzaSyAXST1zO_7Rzal1nmkS6mcdib2L6LVbHC8",
        authDomain: "chatsystem1-b341f.firebaseapp.com",
        databaseURL: "https://chatsystem1-b341f-default-rtdb.firebaseio.com",
        projectId: "chatsystem1-b341f",
        storageBucket: "chatsystem1-b341f.appspot.com",
        messagingSenderId: "111851594752",
        appId: "1:111851594752:web:ab7955b9b052ba907c64e5",
        measurementId: "G-M14RE2SYWG"
      };// 게시물에 좋아요를 눌렀을 때 호출
      function setupLikeButton(postId) {
          const likeButton = document.getElementById(`like-button-${postId}`);
          if (!likeButton) return;
      
          likeButton.addEventListener("click", async () => {
              try {
                  const postRef = db.collection("posts").doc(postId);
                  await postRef.update({
                      likes: firebase.firestore.FieldValue.increment(1), // 게시물 좋아요 수 증가
                  });
      
                  // 좋아요를 받은 사용자의 UID 가져오기
                  const postDoc = await postRef.get();
                  const postData = postDoc.data();
                  const postAuthor = postData.author; // 작성자 이름 또는 UID
      
                  if (postAuthor) {
                      const usersSnapshot = await db
                          .collection("users")
                          .where("name", "==", postAuthor)
                          .get();
      
                      if (!usersSnapshot.empty) {
                          const authorDoc = usersSnapshot.docs[0];
                          const authorId = authorDoc.id;
      
                          // 작성자의 좋아요 수 업데이트
                          if (authorId !== currentUser.uid) {
                              await db.collection("users").doc(authorId).update({
                                  likesReceived: firebase.firestore.FieldValue.increment(1),
                              });
      
                              // 작성자 좋아요 뱃지 업데이트
                              const authorUserDoc = await db.collection("users").doc(authorId).get();
                              const authorLikes = authorUserDoc.data().likesReceived || 0;
                              const authorProgress = Math.min((authorLikes / 50) * 100, 100);
      
                              await db.collection("users").doc(authorId).update({
                                  [`badges.likes_50`]: {
                                      progress: `${authorProgress}%`,
                                      achieved: authorLikes >= 50,
                                  },
                              });
      
                              if (authorLikes >= 50) {
                                  console.log(`🎉 ${postAuthor}님이 좋아요 50개를 달성하여 뱃지를 획득했습니다!`);
                              }
                          }
                      }
                  }
      
                  alert("좋아요를 눌렀습니다!");
              } catch (error) {
                  console.error("좋아요 처리 중 오류:", error);
              }
          });
      }
    
        firebase.app(); // Use the existing Firebase app
    
        const toggleModal = (modalId, show) => {
            const modal = document.getElementById(modalId);
            if (!modal) {
              console.error(`모달 요소가 null입니다: ${modalId}`);
              return;
            }
            modal.classList.toggle("hidden", !show);
        
            // 모달 열기 시 body 스크롤 방지
            document.body.style.overflow = show ? "hidden" : "auto";
          };
    const auth = firebase.auth();
    const db = firebase.firestore();
  
    let currentUser = null;
    document.getElementById("badge-catalog-button").addEventListener("click", () => {
        loadBadges();
        toggleModal("badge-modal", true);
      });
      
      document.getElementById("close-badge-modal").addEventListener("click", () => {
        toggleModal("badge-modal", false);
      });
    // 뱃지 정의
     // 절대자 배지 구매 이벤트
  document.getElementById("buy-absolute-badge")?.addEventListener("click", async () => {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      // 사용자 정보 가져오기
      const userDoc = await db.collection("users").doc(currentUser.uid).get();
      const userData = userDoc.data();
      const currentPoints = userData.points || 0;

      // 포인트 확인
      if (currentPoints < 100000000) {
        alert("포인트가 부족합니다!");
        return;
      }

      // 포인트 차감
      await db.collection("users").doc(currentUser.uid).update({
        points: firebase.firestore.FieldValue.increment(-100000000),
        [`badges.absolute`]: {
          progress: "100%",
          achieved: true,
        },
      });

      alert("🎉 절대자 배지를 성공적으로 구매했습니다!");
      loadBadges(); // 배지 UI 업데이트
    } catch (error) {
      console.error("절대자 배지 구매 중 오류 발생:", error);
      alert("배지 구매 중 오류가 발생했습니다.");
    }
  });
    const badges = [
        { id: "first_post", name: "첫 글 작성", icon: "fa-pen", task: "첫 번째 게시물을 작성하세요.", progress: "0%", achieved: false },
        { id: "comments_100", name: "댓글 100개", icon: "fa-comments", task: "댓글 100개를 작성하세요.", progress: "0%", achieved: false },
        
        { id: "login_7_days", name: "7일 연속 로그인", icon: "fa-calendar-check", task: "7일 연속 로그인하세요.", progress: "0%", achieved: false },
        { id: "spender", name: "포인트 지출", icon: "fa-coins", task: "포인트를 100점 사용하세요.", progress: "0%", achieved: false },
        // 새로운 뱃지 추가
        { id: "top_contributor", name: "최고 기여자", icon: "fa-crown", task: "게시물 10개를 작성하세요.", progress: "0%", achieved: false },
        { id: "daily_checker", name: "출석왕", icon: "fa-calendar-day", task: "30일 동안 매일 로그인하세요.", progress: "0%", achieved: false },
        { id: "engaged_user", name: "활발한 유저", icon: "fa-users", task: "100개의 게시물에 댓글을 작성하세요.", progress: "0%", achieved: false },
        { id: "content_creator", name: "콘텐츠 제작자", icon: "fa-video", task: "이미지 또는 비디오 포함 게시물을 5개 작성하세요.", progress: "0%", achieved: false },
        { id: "post_master", name: "게시물 마스터", icon: "fa-scroll", task: "게시물 100개를 작성하세요.", progress: "0%", achieved: false },
        { id: "absolute", name: "절대자", icon: "fa-regular fa-chess-king", task: "상점에서 구매하여 획득하세요.", progress: "0%", achieved: false }
    ];
    
    async function onTopContributor() {
        await updateBadgeProgress("top_contributor", 10, "최고 기여자 뱃지를 획득했습니다!");
    }
    
    async function onDailyChecker() {
        const userDoc = await db.collection("users").doc(currentUser.uid).get();
        const loginStreak = userDoc.data().loginStreak || 0;
        const lastLogin = userDoc.data().lastLogin?.toDate() || null;
    
        const today = new Date();
        const isNextDay =
            lastLogin &&
            today.getDate() !== lastLogin.getDate() &&
            today.getTime() - lastLogin.getTime() < 2 * 24 * 60 * 60 * 1000;
    
        const newStreak = isNextDay ? loginStreak + 1 : 1;
        const progress = Math.min((newStreak / 30) * 100, 100);
    
        await db.collection("users").doc(currentUser.uid).update({
            loginStreak: newStreak,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            [`badges.daily_checker`]: {
                progress: `${progress}%`,
                achieved: newStreak >= 30
            }
        });
    
        
    }
    
    async function onEngagedUser() {
        await updateBadgeProgress("engaged_user", 1, "활발한 유저 뱃지를 획득했습니다!");
    }
    
    async function onContentCreator() {
        await updateBadgeProgress("content_creator", 1, "콘텐츠 제작자 뱃지를 획득했습니다!");
    }
    
    async function onPostMaster() {
        await updateBadgeProgress("post_master", 1, "게시물 마스터 뱃지를 획득했습니다!");
    }
    
    // UI 업데이트
    function loadBadges() {
      const badgeContainer = document.getElementById("badge-container");
      badgeContainer.innerHTML = "";
  
      badges.forEach((badge) => {
        const badgeCard = document.createElement("div");
        badgeCard.className = "badge-card";
  
        const iconClass = badge.achieved ? "text-yellow-500" : "text-gray-400";
        const iconOpacity = badge.achieved ? "" : "opacity-50";
  
        badgeCard.innerHTML = `
          <div class="icon-container ${iconOpacity}">
            <i class="fas ${badge.icon} text-5xl ${iconClass}"></i>
          </div>
          <p class="text-sm font-bold mt-2">${badge.name}</p>
          <p class="progress text-xs">${badge.progress}</p>
          <p class="task text-xs italic text-gray-500">${badge.task}</p>
        `;
  
        badgeContainer.appendChild(badgeCard);
      });
    }
  // 이벤트 연결 예시
document.getElementById("save-post")?.addEventListener("click", () => {
    onFirstPost();
    onTopContributor();
    onContentCreator();
    onPostMaster();
});

document.getElementById("add-comment")?.addEventListener("click", () => {
    onCommentAdded();
    onEngagedUser();
});

// 로그인 이벤트
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await onDailyChecker();
    }
});

    // 활동 이벤트 처리 함수
    async function onFirstPost() {
      await updateBadgeProgress("first_post", 100, "첫 글 작성 뱃지를 획득했습니다!");
    }
  
    async function onCommentAdded() {
      await updateBadgeProgress("comments_100", 1, "댓글 100개 작성 뱃지를 획득했습니다!");
    }
  
 
  
    async function onDailyLogin() {
      const userDoc = await db.collection("users").doc(currentUser.uid).get();
      const dailyStreak = userDoc.data().dailyStreak || 0;
      const lastLogin = userDoc.data().lastLogin?.toDate() || null;
  
      const today = new Date();
      const isNextDay =
        lastLogin &&
        today.getDate() !== lastLogin.getDate() &&
        today.getTime() - lastLogin.getTime() < 2 * 24 * 60 * 60 * 1000;
  
      const newStreak = isNextDay ? dailyStreak + 1 : 1;
      const progress = Math.min((newStreak / 7) * 100, 100);
  
      await db.collection("users").doc(currentUser.uid).update({
        dailyStreak: newStreak,
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        [`badges.login_7_days`]: {
          progress: `${progress}%`,
          achieved: newStreak >= 7,
        },
      });
  
    }
  
    async function onPointsSpent(pointsSpent) {
      await updateBadgeProgress("spender", pointsSpent, "포인트 지출 뱃지를 획득했습니다!");
    }
  
    // 뱃지 진행 상황 업데이트 함수
    async function updateBadgeProgress(badgeId, increment, achievementMessage) {
      const userDoc = await db.collection("users").doc(currentUser.uid).get();
      const currentProgress = parseInt(userDoc.data().badges?.[badgeId]?.progress || "0", 10);
      const newProgress = Math.min(currentProgress + increment, 100);
  
      await db.collection("users").doc(currentUser.uid).update({
        [`badges.${badgeId}`]: {
          progress: `${newProgress}%`,
          achieved: newProgress === 100,
        },
      });
  
   
    }
  
    // Firebase 실시간 업데이트
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        currentUser = user;
  
        db.collection("users")
          .doc(user.uid)
          .onSnapshot((doc) => {
            const userData = doc.data();
            if (userData && userData.badges) {
              badges.forEach((badge) => {
                const userBadge = userData.badges[badge.id] || {};
                badge.progress = userBadge.progress || "0%";
                badge.achieved = userBadge.achieved || false;
              });
              loadBadges();
            }
          });
  
        // 연속 로그인 처리
        onDailyLogin();
      } else {
        currentUser = null;
      }
    });
  
    // 이벤트 연결 예시
    document.getElementById("save-post")?.addEventListener("click", () => {
      onFirstPost();
    });
  
    document.getElementById("add-comment")?.addEventListener("click", () => {
      onCommentAdded();
    });
  
    // 기타 이벤트 추가는 필요에 따라 작성
  });
  
