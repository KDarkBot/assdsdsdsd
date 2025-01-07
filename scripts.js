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
    measurementId: "G-M14RE2SYWG",
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();

  let currentUser = null;
  let isAdmin = false;
  const likedPosts = new Set(); // 좋아요를 누른 게시물 ID 저장

  // UI 업데이트 함수
  const updateUI = () => {
    const loginButton = document.getElementById("login-button");
    const signupButton = document.getElementById("signup-button");
    const logoutButton = document.getElementById("logout-button");

    if (currentUser) {
      loginButton?.classList.add("hidden");
      signupButton?.classList.add("hidden");
      logoutButton?.classList.remove("hidden");
    } else {
      loginButton?.classList.remove("hidden");
      signupButton?.classList.remove("hidden");
      logoutButton?.classList.add("hidden");
    }
  };

  // 모달 열기/닫기 함수
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
      // Firestore에서 현재 사용자의 이름 가져오기
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

    // 모달 외부 클릭 시 닫기
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.add("hidden");
          document.body.style.overflow = "auto";
        }
      });
    });
  };

  // 관리자 확인 함수
  const checkIfAdmin = async () => {
    if (currentUser) {
      const userDoc = await db.collection("users").doc(currentUser.uid).get();
      isAdmin = userDoc.exists && userDoc.data().role === "admin";
    } else {
      isAdmin = false;
    }
  };

  // 로그인 처리
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
      })
      .catch((error) => {
        console.error("로그인 실패:", error);
        alert(`로그인 실패: ${error.message}`);
      });
  });

  // 회원가입 처리
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

  // 로그아웃 처리
  document.getElementById("logout-button")?.addEventListener("click", () => {
    auth.signOut()
      .then(() => {
        alert("로그아웃 성공!");
        currentUser = null;
        updateUI();
      })
      .catch((error) => {
        console.error("로그아웃 실패:", error);
        alert(`로그아웃 실패: ${error.message}`);
      });
  });

  // 게시물 불러오기
  const loadPosts = () => {
    const postList = document.getElementById("post-list");
    db.collection("posts")
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
        postList.innerHTML = "";
        let count = snapshot.size;

        snapshot.forEach((doc) => {
          const post = doc.data();
          const timestamp = post.timestamp?.toDate().toLocaleString() || "시간 정보 없음";

          const row = document.createElement("tr");
          row.innerHTML = `
            <td class="py-4 px-6">${count--}</td>
            <td class="py-4 px-6">${post.title || "제목 없음"}</td>
            <td class="py-4 px-6">${post.author || "작성자 없음"}</td>
            <td class="py-4 px-6">${timestamp}</td>
            <td class="py-4 px-6">${post.likes || 0}</td>
            <td class="py-4 px-6">
              <button class="view-post bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600" data-id="${doc.id}">보기</button>
            </td>
          `;
          postList.appendChild(row);
        });

        // 게시물 보기 버튼 이벤트 추가
        document.querySelectorAll(".view-post").forEach((button) => {
          button.addEventListener("click", (e) => {
            const postId = e.target.dataset.id;
            viewPost(postId);
          });
        });
      });
  };

  // 게시물 보기
  const viewPost = (postId) => {
    db.collection("posts").doc(postId).get().then((doc) => {
      if (doc.exists) {
        const post = doc.data();
        const timestamp = post.timestamp?.toDate().toLocaleString() || "시간 정보 없음";

        document.getElementById("view-title").textContent = post.title || "제목 없음";
        document.getElementById("view-author").textContent = post.author || "작성자 없음";
        document.getElementById("view-timestamp").textContent = timestamp;
        document.getElementById("view-content").textContent = post.content || "내용 없음";

        const imageElement = document.getElementById("view-image");
        if (post.imageUrl) {
          imageElement.innerHTML = `<img src="${post.imageUrl}" alt="게시물 이미지" class="max-h-64 w-full object-cover rounded-lg">`;
        } else {
          imageElement.innerHTML = `<span class="text-gray-500">이미지가 없습니다</span>`;
        }

        toggleModal("view-modal", true);

        const likeButton = document.getElementById("like-post");
        likeButton.onclick = () => {
          if (likedPosts.has(postId)) {
            alert("이미 좋아요를 누르셨습니다.");
          } else {
            db.collection("posts").doc(postId).update({
              likes: firebase.firestore.FieldValue.increment(1),
            }).then(() => {
              likedPosts.add(postId);
              alert("좋아요를 눌렀습니다!");
            });
          }
        };
      }
    });
  };

  // 초기화
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
      await checkIfAdmin();
    } else {
      isAdmin = false;
    }
    updateUI();
    loadPosts();
  });

  setupModalEventListeners();
});