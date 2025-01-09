
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
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------
  // 1) Firebase 초기화
  // -------------------------------
 

  let currentUser = null;
  let isAdmin = false;
  let likedPosts = new Set(); // 좋아요 중복 방지

  // -------------------------------
  // 2) UI 업데이트
  // -------------------------------
 // 2) UI 업데이트
 const updateUI = () => {
  const loginButton = document.getElementById("login-button");
  const signupButton = document.getElementById("signup-button");
  const logoutButton = document.getElementById("logout-button");
  const editUserButton = document.getElementById("edit-user-button");
  const shopButton = document.getElementById("shop-button");
  const openGivePointsButton = document.getElementById("open-give-points");
  const gameblebt = document.getElementById("odd-even-gamble-button");
  // 모바일 버튼
  const mobileLoginButton = document.getElementById("mobile-login-button");
  const mobileSignupButton = document.getElementById("mobile-signup-button");
  const mobileLogoutButton = document.getElementById("mobile-logout-button");
  const mobileShopButton = document.getElementById("mobile-shop-button");
  const mobileGivePointsButton = document.getElementById("mobile-give-points");
  const mobileeditUserButton = document.getElementById("mobile-edit-user-button");
  const mobilegameblebt = document.getElementById("mobile-odd-even-button");
  
  if (currentUser) {
    // 로그인 상태
    loginButton?.classList.add("hidden");
    signupButton?.classList.add("hidden");
    logoutButton?.classList.remove("hidden");
    editUserButton?.classList.remove("hidden");
    shopButton?.classList.remove("hidden");
    mobileShopButton?.classList.remove("hidden");
    mobileeditUserButton?.classList.remove("hidden");
    gameblebt?.classList.remove("hidden");
    mobilegameblebt?.classList.remove("hidden")
    // 관리자의 포인트 지급 버튼
    if (isAdmin) {
      openGivePointsButton?.classList.remove("hidden");
      mobileGivePointsButton?.classList.remove("hidden");
    } else {
      openGivePointsButton?.classList.add("hidden");
      mobileGivePointsButton?.classList.add("hidden");
    }

    // 모바일 메뉴 상태 업데이트
    mobileLoginButton?.classList.add("hidden");
    mobileSignupButton?.classList.add("hidden");
    mobileLogoutButton?.classList.remove("hidden");
  } else {
    // 비로그인 상태
    loginButton?.classList.remove("hidden");
    signupButton?.classList.remove("hidden");
    logoutButton?.classList.add("hidden");
    editUserButton?.classList.add("hidden");
    shopButton?.classList.add("hidden");
    openGivePointsButton?.classList.add("hidden");

    // 모바일 메뉴 상태 업데이트
    mobileLoginButton?.classList.remove("hidden");
    mobileSignupButton?.classList.remove("hidden");
    mobileLogoutButton?.classList.add("hidden");
    mobileShopButton?.classList.add("hidden");
    mobileGivePointsButton?.classList.add("hidden");
    mobileeditUserButton?.classList.add("hidden");

    gameblebt?.classList.add("hidden");
    mobilegameblebt?.classList.add("hidden")
  }
};



// 모바일 메뉴 이벤트 추가
document.getElementById("mobile-login-button")?.addEventListener("click", () => {
  toggleModal("login-modal", true);
});

document.getElementById("mobile-signup-button")?.addEventListener("click", () => {
  toggleModal("signup-modal", true);
});

document.getElementById("mobile-logout-button")?.addEventListener("click", () => {
  auth.signOut()
    .then(() => {
      alert("로그아웃 성공!");
      updateUI();
    })
    .catch((error) => {
      console.error("로그아웃 실패:", error);
      alert("로그아웃 실패: " + error.message);
    });
});

document.getElementById("mobile-edit-user-button")?.addEventListener("click", () => {
  toggleModal("edit-user-modal", true);
});

document.getElementById("mobile-shop-button")?.addEventListener("click", () => {
  toggleModal("shop-modal", true);
});

// 페이지 로드 시 UI 업데이트
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  if (user) {
    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      isAdmin = userDoc.exists && userDoc.data().role === "admin"; // 관리자 여부 확인
    } catch (error) {
      console.error("관리자 확인 오류:", error);
      isAdmin = false;
    }
  } else {
    isAdmin = false;
  }
  updateUI(); // 상태 업데이트
});

  // -------------------------------
  // 3) 모달 열기/닫기 함수
  // -------------------------------
  const toggleModal = (modalId, show) => {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`모달 요소가 null입니다: ${modalId}`);
      return;
    }
    modal.classList.toggle("hidden", !show);

    // 모달 열기 시 스크롤 방지
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  };
  document.getElementById("save-post")?.addEventListener("click", async () => {
    const title = document.getElementById("post-title").value.trim();
    const content = document.getElementById("post-content").value.trim();
    const file = document.getElementById("post-file").files[0];
  
    if (!title || !content) {
      alert("제목과 내용을 입력하세요.");
      return;
    }
  
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }
  
    try {
      // 구매 비용(예: 50 포인트)
      const cost = 50;
      // 사용자 정보 가져오기
      const userDoc = await db.collection("users").doc(currentUser.uid).get();
      const authorName = userDoc.exists ? userDoc.data().name : "익명";
  
      const savePostToFirestore = (imageUrl = null) => {
        db.collection("posts").add({
          title,
          content,
          imageUrl,
          author: authorName, // 작성자 이름 저장
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          likes: 0,
          rating: 0,
        }).then(() => {
          alert("글이 성공적으로 작성되었습니다!");
          toggleModal("post-modal", false);
          document.getElementById("post-title").value = "";
          document.getElementById("post-content").value = "";
          document.getElementById("post-file").value = "";
        });
      };
  
      if (file) {
        const storageRef = storage.ref(`images/${Date.now()}_${file.name}`);
        const snapshot = await storageRef.put(file);
        const url = await snapshot.ref.getDownloadURL();
        savePostToFirestore(url);
      } else {
        savePostToFirestore();
      }
    } catch (error) {
      console.error("글 작성 중 오류 발생:", error);
      alert("글 작성 중 오류가 발생했습니다.");
    }
  });
  const checkIfAdmin = async () => {
    if (currentUser) {
      try {
        const userDoc = await db.collection("users").doc(currentUser.uid).get();
        if (userDoc.exists && userDoc.data().role === "admin") {
          console.log("관리자 확인 성공");
          return true;
        }
      } catch (error) {
        console.error("관리자 확인 중 오류:", error);
      }
    }
    console.log("관리자가 아님");
    return false;
  };
  
  const enableRatingSection = async (postId) => {
    const isAdmin = await checkIfAdmin();
    const ratingSection = document.getElementById("rating-section");
  
    if (isAdmin) {
      ratingSection?.classList.remove("hidden");
      document.querySelectorAll(".rate").forEach((button) => {
        button.onclick = () => {
          const rating = parseInt(button.dataset.rating);
          db.collection("posts").doc(postId).update({ rating })
            .then(() => {
              alert(`${rating}점을 부여했습니다.`);
              document.getElementById("view-rating").textContent = `${rating}점`;
            })
            .catch((error) => {
              console.error("별점 저장 실패:", error);
              alert(`별점 저장 실패: ${error.message}`);
            });
        };
      });
    } else {
      ratingSection?.classList.add("hidden");
    }
  };
  
  
  

  // 이벤트 리스너 설정
  const setupModalEventListeners = () => {
    // 로그인 모달 열기/닫기
    document.getElementById("login-button")?.addEventListener("click", () => {
      toggleModal("login-modal", true);
    });
    document.getElementById("close-login-modal")?.addEventListener("click", () => {
      toggleModal("login-modal", false);
    });

    // 회원가입 모달 열기/닫기
    document.getElementById("signup-button")?.addEventListener("click", () => {
      toggleModal("signup-modal", true);
    });
    document.getElementById("close-signup-modal")?.addEventListener("click", () => {
      toggleModal("signup-modal", false);
    });

    // 새 글 작성 모달 열기/닫기
    document.getElementById("new-post")?.addEventListener("click", () => {
      toggleModal("post-modal", true);
    });
    document.getElementById("close-post-modal")?.addEventListener("click", () => {
      toggleModal("post-modal", false);
    });

    // 게시물 보기 모달 닫기
    document.getElementById("close-view-modal")?.addEventListener("click", () => {
      toggleModal("view-modal", false);
    });

    alert("포인트 전송 완료!");
    sendPointsModal.classList.add("hidden");
    document.body.style.overflow = "auto";

    // UI 업데이트
    updateUI();
  } catch (error) {
    console.error("포인트 전송 중 오류 발생:", error);
    alert("포인트 전송 중 오류가 발생했습니다.");
  }
});



// 초기 데이터 로드
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    const userDoc = await db.collection("users").doc(user.uid).get();
    isAdmin = userDoc.exists && userDoc.data().role === "admin";

    loadPosts(); // 초기 데이터 로드
  } else {
    console.log("로그인이 필요합니다.");
  }
});

  
  
  const stealPost = async (postId) => {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      const userDoc = await db.collection("users").doc(currentUser.uid).get();
      const userName = userDoc.data().name || "익명";
      const userStealItems = userDoc.data().stealItems || 0;
  
      if (userStealItems <= 0) {
        alert("뺏기 아이템이 부족합니다.");
        return;
      }
  
      // 게시물의 작성자 이름 변경
      await db.collection("posts").doc(postId).update({
        author: userName,
      });
  
      // 사용자 뺏기 아이템 차감
      await db.collection("users").doc(currentUser.uid).update({
        stealItems: firebase.firestore.FieldValue.increment(-1),
      });
  
      alert("게시물을 성공적으로 뺏었습니다!");
      loadPosts(); // 게시물 목록 새로고침
    } catch (error) {
      console.error("게시물 뺏기 실패:", error);
      alert("게시물을 뺏는 중 오류가 발생했습니다.");
    }
  };
  
  // -------------------------------
  // [신규 추가] 10.5) 모든 사용자 불러오기 + 포인트 지급
  // -------------------------------
  const loadAllUsers = () => {
    const userListDiv = document.getElementById("user-list");
    if (!userListDiv) return;

    // users 컬렉션 전체 조회
    db.collection("users").get().then((snapshot) => {
      userListDiv.innerHTML = "";
      snapshot.forEach((doc) => {
        const userData = doc.data();
        const uid = doc.id;

        const rowDiv = document.createElement("div");
        rowDiv.className = "p-2 border rounded flex items-center justify-between";

        // 사용자 정보 표시
        const userInfo = `
          <span>이름: ${userData.name || "이름 없음"} / 이메일: ${userData.email || ""} / 포인트: ${userData.points || 0}</span>
        `;

        // 관리자 전용 "포인트 지급" 버튼
        const givePointsButton = isAdmin ? `
          <button class="give-points-btn bg-yellow-500 text-white px-2 py-1 rounded ml-2" data-uid="${uid}">
            포인트 지급
          </button>
        ` : "";

        rowDiv.innerHTML = userInfo + givePointsButton;
        userListDiv.appendChild(rowDiv);
      });

      // 포인트 지급 버튼 이벤트
      document.querySelectorAll(".give-points-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const targetUid = e.target.dataset.uid;
          givePointsToUser(targetUid);
        });
      });
    });
  };
// 포인트 전송 모달 열기/닫기
const openSendPointsModal = document.getElementById("open-send-points-modal");
const closeSendPointsModal = document.getElementById("close-send-points-modal");
const sendPointsModal = document.getElementById("send-points-modal");
document.getElementById("mobile-send-points-button")?.addEventListener("click", () => {
  if (!currentUser) {
    alert("로그인이 필요합니다.");
    return;
  }
  // 포인트 보내기 모달 열기
  toggleModal("send-points-modal", true);
});

openSendPointsModal.addEventListener("click", () => {
  sendPointsModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
});

closeSendPointsModal.addEventListener("click", () => {
  sendPointsModal.classList.add("hidden");
  document.body.style.overflow = "auto";
});
  // [신규 함수] 실제 포인트 지급 로직
function givePointsToUser(targetUid) {
  // 지급할 포인트 양 입력
  const amountStr = prompt("지급할 포인트 양을 입력하세요", "10");
  
  // 입력값 검증: 숫자로 변환
  const amount = parseInt(amountStr, 10);
  if (isNaN(amount) || amount <= 0) {
    alert("유효한 양수를 입력하세요.");
    return;
  }

  // Firestore에서 points 증가
  db.collection("users").doc(targetUid)
    .update({
      points: firebase.firestore.FieldValue.increment(amount) // 양수만 허용됨
    })
    .then(() => {
      alert(`${amount} 포인트가 지급되었습니다!`);
      // 사용자 목록 재로딩
      loadAllUsers();
    })
    .catch((err) => {
      console.error("포인트 지급 오류:", err);
      alert("포인트 지급 중 오류가 발생했습니다.");
    });
}


  // 포인트 지급 모달 열기 버튼
  const openGivePointsButton = document.getElementById("open-give-points");
  openGivePointsButton?.addEventListener("click", () => {
    // 관리자만 열 수 있다고 가정 (isAdmin 체크)
    if (!isAdmin) {
      alert("관리자만 접근 가능합니다.");
      return;
    }
    // 모달 열기
    toggleModal("give-points-modal", true);
    // 열 때마다 전체 유저 목록 로드 
    loadAllUsers();
  });

  // 포인트 지급 모달 닫기 버튼
  const closeGivePointsModal = document.getElementById("close-give-points-modal");
  closeGivePointsModal?.addEventListener("click", () => {
    toggleModal("give-points-modal", false);
  });
  // -------------------------------
  // 11) 로그인, 회원가입, 로그아웃
  // -------------------------------
  // (예시)
  document.getElementById("login-submit")?.addEventListener("click", () => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!email || !password) {
      alert("이메일과 비밀번호를 입력하세요.");
      return;
    }

    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        alert("로그인 성공!");
        toggleModal("login-modal", false);
        window.location.reload(); // 새로고침 추가
      })
      .catch((error) => {
        console.error("로그인 실패:", error);
        alert(`로그인 실패: ${error.message}`);
      });
  });

  document.getElementById("signup-submit")?.addEventListener("click", () => {
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const name = document.getElementById("signup-name").value.trim();

    if (!email || !password || !name) {
      alert("모든 필드를 입력하세요.");
      return;
    }

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        // Firestore에 user 문서 생성
        return db.collection("users").doc(user.uid).set({ name, email });
      })
      .then(() => {
        alert("회원가입 성공!");
        toggleModal("signup-modal", false);
      })
      .catch((error) => {
        console.error("회원가입 실패:", error);
        alert(`회원가입 실패: ${error.message}`);
      });
  });

  // 회원 정보 수정 (이름 변경)
  document.getElementById("save-user-info")?.addEventListener("click", () => {
    const newName = document.getElementById("edit-username").value.trim();
    if (!newName) {
      alert("새 이름을 입력하세요.");
      return;
    }
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    // Firestore users/{uid} 문서 업데이트
    db.collection("users")
      .doc(currentUser.uid)
      .update({ name: newName })
      .then(() => {
        alert("이름이 변경되었습니다!");
        toggleModal("edit-user-modal", false);
        document.getElementById("edit-username").value = "";
      })
      .catch((error) => {
        console.error("이름 업데이트 실패:", error);
        alert("이름 업데이트 중 오류가 발생했습니다.");
      });
  });

  document.getElementById("logout-button")?.addEventListener("click", () => {
    auth.signOut()
      .then(() => {
        alert("로그아웃 성공!");
        currentUser = null;
        
        updateUI();
        window.location.reload(); // 새로고침 추가
      })
      .catch((error) => {
        console.error("로그아웃 실패:", error);
        alert(`로그아웃 실패: ${error.message}`);
      });
  });

  // -------------------------------
  // 12) 모달 외부 클릭 등 설정
  // -------------------------------
  const setupModalEventListeners = () => {
    // 로그인 모달 열기
    document.getElementById("login-button")?.addEventListener("click", () => {
      toggleModal("login-modal", true);
    });
    document.getElementById("close-login-modal")?.addEventListener("click", () => {
      toggleModal("login-modal", false);
    });

    // 회원가입 모달 열기
    document.getElementById("signup-button")?.addEventListener("click", () => {
      toggleModal("signup-modal", true);
    });
    document.getElementById("close-signup-modal")?.addEventListener("click", () => {
      toggleModal("signup-modal", false);
    });

    // 새 글 작성 모달
    document.getElementById("new-post")?.addEventListener("click", () => {
      toggleModal("post-modal", true);
    });
    document.getElementById("close-post-modal")?.addEventListener("click", () => {
      toggleModal("post-modal", false);
    });

    // 게시물 보기 모달
    document.getElementById("close-view-modal")?.addEventListener("click", () => {
      toggleModal("view-modal", false);
    });

    // 회원 정보 수정 모달
    document.getElementById("edit-user-button")?.addEventListener("click", () => {
      toggleModal("edit-user-modal", true);
    });
    document.getElementById("close-edit-user-modal")?.addEventListener("click", () => {
      toggleModal("edit-user-modal", false);
    });

    // 모달 배경 클릭 시 닫기
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.add("hidden");
          document.body.style.overflow = "auto";
        }
      });
    });
  };
// 모바일 메뉴의 랭킹 버튼 클릭 이벤트
document.getElementById("mobile-ranking-button")?.addEventListener("click", () => {
  window.location.href = "index2.html"; // 랭킹 페이지로 이동
});

  // -------------------------------
  // 13) Firebase 인증 상태 체크
  // -------------------------------
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
      console.log("로그인된 사용자:", user.email);
      // 관리자 여부 확인
      isAdmin = await checkIfAdmin();
    } else {
      console.log("사용자가 로그인하지 않았습니다.");
      isAdmin = false;
    }
    updateUI();
    // 게시글 목록 로드
    loadPosts();

    // 관리자면 전체 유저 목록 로드
    if (isAdmin) {
      loadAllUsers();
    }
  });

  // -------------------------------
  // 14) init
  // -------------------------------
  setupModalEventListeners();
});