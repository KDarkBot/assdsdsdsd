document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------
  // 1) Firebase 초기화
  // -------------------------------
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

  let currentUser = null;
  let isAdmin = false;
  let likedPosts = new Set(); // 좋아요 중복 방지

  // -------------------------------
  // 2) UI 업데이트
  // -------------------------------
  const updateUI = () => {
    const loginButton = document.getElementById("login-button");
    const signupButton = document.getElementById("signup-button");
    const logoutButton = document.getElementById("logout-button");
    const editUserButton = document.getElementById("edit-user-button");
    if (currentUser) {
      loginButton?.classList.add("hidden");
      signupButton?.classList.add("hidden");
      logoutButton?.classList.remove("hidden");
      editUserButton?.classList.remove("hidden");
    } else {
      loginButton?.classList.remove("hidden");
      signupButton?.classList.remove("hidden");
      logoutButton?.classList.add("hidden");
      editUserButton?.classList.add("hidden");
    }
  };

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

    // 모달 열기 시 body 스크롤 방지
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  };

  // -------------------------------
  // 4) 새 글 작성 (이미지 업로드 포함)
  // -------------------------------
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
          author: authorName, 
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

  // -------------------------------
  // 5) 관리자 확인
  // -------------------------------
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

  // -------------------------------
  // 6) 별점 기능
  // -------------------------------
  const enableRatingSection = async (postId) => {
    const ratingSection = document.getElementById("rating-section");
    const adminCheck = await checkIfAdmin(); // 현재 사용자 관리자 여부

    if (adminCheck) {
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

  // -------------------------------
  // 7) 댓글 작성
  // -------------------------------
  const addComment = (postId) => {
    const commentInput = document.getElementById("comment-input");
    const content = commentInput.value.trim();

    if (!content) {
      alert("댓글을 입력하세요.");
      return;
    }
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 사용자 이름 가져오기
    db.collection("users").doc(currentUser.uid).get().then((doc) => {
      const userName = (doc.exists && doc.data().name) || "익명";

      // Firestore에 댓글 저장
      db.collection("posts").doc(postId)
        .collection("comments")
        .add({
          content,
          author: userName,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
          commentInput.value = "";
          alert("댓글이 작성되었습니다!");
        })
        .catch((error) => {
          console.error("댓글 작성 실패:", error);
          alert("댓글 작성 중 오류가 발생했습니다.");
        });
    });
  };

  // -------------------------------
  // 8) 댓글 실시간 불러오기
  // -------------------------------
  const loadComments = (postId) => {
    const commentList = document.getElementById("comment-list");
    db.collection("posts").doc(postId)
      .collection("comments")
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
        commentList.innerHTML = "";
        snapshot.forEach((doc) => {
          const comment = doc.data();
          const time = comment.timestamp?.toDate().toLocaleString() || "시간 정보 없음";

          const commentDiv = document.createElement("div");
          commentDiv.classList.add("p-2", "border", "rounded");
          commentDiv.innerHTML = `
            <p class="text-sm text-gray-800 font-semibold">${comment.author || "익명"}</p>
            <p class="text-sm mb-1">${comment.content}</p>
            <p class="text-xs text-gray-500">${time}</p>
          `;
          commentList.appendChild(commentDiv);
        });
      });
  };
  const deletePost = (postId) => {
    // Firestore 문서 삭제
    db.collection("posts").doc(postId).delete()
      .then(() => {
     
        // onSnapshot 실시간 구독 중이면 목록 자동 갱신
      })
      .catch((error) => {
        console.error("게시물 삭제 오류:", error);
        alert("게시물 삭제 중 오류가 발생했습니다.");
      });
  };
  
  // -------------------------------
  // 9) 게시물 보기(viewPost)
  // -------------------------------
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

        // 좋아요 버튼
        const likeButton = document.getElementById("like-post");
        likeButton.onclick = () => {
          // 중복 좋아요 방지
          if (likedPosts.has(postId)) {
            alert("이미 좋아요를 누르셨습니다!");
            return;
          }

          // 좋아요 +1
          db.collection("posts").doc(postId).update({
            likes: firebase.firestore.FieldValue.increment(1)
          }).then(() => {
            likedPosts.add(postId);
            alert("좋아요를 눌렀습니다!");
          }).catch((error) => {
            console.error("좋아요 업데이트 실패:", error);
            alert("좋아요 업데이트 중 오류가 발생했습니다.");
          });
        };

        // 댓글 실시간 불러오기
        loadComments(postId);

        // 댓글 작성 버튼
        const addCommentButton = document.getElementById("add-comment");
        addCommentButton.onclick = () => addComment(postId);

        // 관리자 별점 섹션
        document.getElementById("view-rating").textContent = post.rating ? `${post.rating}점` : "없음";
        enableRatingSection(postId);

        // 모달 열기
        toggleModal("view-modal", true);
      }
    });
  };

  // -------------------------------
  // 10) 게시물 목록 불러오기(loadPosts)
  // -------------------------------
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
            <!-- NO 열 (모바일 숨김) -->
            <td class="py-4 px-6 hidden md:table-cell">${count--}</td>
            <td class="py-4 px-6">${post.title || "제목 없음"}</td>
            <td class="py-4 px-6">${post.author || "작성자 없음"}</td>
            <td class="py-4 px-6 hidden md:table-cell">${timestamp}</td>
            <td class="py-4 px-6">${post.likes || 0}</td>
            <!-- 보기 + (관리자만) 삭제 버튼 -->
            <td class="py-4 px-6 text-left">
              <button 
                class="view-post bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600" 
                data-id="${doc.id}"
              >
                보기
              </button>
              ${
                isAdmin
                  ? `<button 
                      class="delete-post bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 ml-2" 
                      data-id="${doc.id}">
                      삭제
                    </button>`
                  : ""
              }
            </td>
          `;
          postList.appendChild(row);
        });
  
        // "보기" 버튼 이벤트
        document.querySelectorAll(".view-post").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const postId = e.target.dataset.id;
            viewPost(postId);
          });
        });
  
        // "삭제" 버튼 이벤트 (관리자만 표시됨)
        document.querySelectorAll(".delete-post").forEach((delBtn) => {
          delBtn.addEventListener("click", (e) => {
            const postId = e.target.dataset.id;
            deletePost(postId);
          });
        });
      });
  };
  
  
  // -------------------------------
  // 11) 로그인, 회원가입, 로그아웃
  // -------------------------------
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
        // 필요 시 updateUI() 또는 다른 UI 갱신 로직
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
    // 로그인 모달
    document.getElementById("login-button")?.addEventListener("click", () => {
      toggleModal("login-modal", true);
    });
    document.getElementById("close-login-modal")?.addEventListener("click", () => {
      toggleModal("login-modal", false);
    });

    // 회원가입 모달
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
// 모달 열기
document.getElementById("edit-user-button")?.addEventListener("click", () => {
  toggleModal("edit-user-modal", true);
});

// 모달 닫기
document.getElementById("close-edit-user-modal")?.addEventListener("click", () => {
  toggleModal("edit-user-modal", false);
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

  // -------------------------------
  // 13) Firebase 인증 상태 체크
  // -------------------------------
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
      console.log("로그인된 사용자:", user.email);
      // 관리자 확인
      isAdmin = await checkIfAdmin();
    } else {
      console.log("사용자가 로그인하지 않았습니다.");
      isAdmin = false;
    }
    updateUI();
    loadPosts();
  });

  // -------------------------------
  // 14) init
  // -------------------------------
  setupModalEventListeners();
});
