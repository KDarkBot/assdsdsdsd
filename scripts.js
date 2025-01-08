const loadPosts = async () => {
  const postList = document.getElementById("post-list");

  try {
    // 1등 사용자 가져오기
    const topUserSnapshot = await db.collection("users")
      .orderBy("points", "desc")
      .limit(1)
      .get();
    const topUser = topUserSnapshot.empty ? null : topUserSnapshot.docs[0].data().name;

    // Firestore의 posts 컬렉션에서 실시간 업데이트 감지
    db.collection("posts")
      .orderBy("timestamp", "desc")
      .onSnapshot(async (snapshot) => {
        // 기존 데이터를 초기화
        postList.innerHTML = "";

        try {
          let userStealItems = 0;
          if (currentUser) {
            const userDoc = await db.collection("users").doc(currentUser.uid).get();
            userStealItems = userDoc.exists ? userDoc.data().stealItems || 0 : 0;
          }

          snapshot.forEach((doc) => {
            const post = doc.data();
            const postId = doc.id;
            const timestamp = post.timestamp?.toDate().toLocaleString() || "시간 정보 없음";

            const isTopUser = topUser === post.author; // 1등 사용자와 일치 여부 확인

            const row = document.createElement("tr");
            row.className = isTopUser ? "top-user-row bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 animate-pulse" : ""; // 1등 스타일 추가
            row.innerHTML = `
              <td class="py-4 px-6 text-sm sm:text-base truncate-mobile">${post.title || "제목 없음"}</td>
              <td class="py-4 px-6 text-sm sm:text-base truncate-mobile">${post.author || "작성자 없음"}</td>
              <td class="py-4 px-6 hidden md:table-cell text-sm sm:text-base">${timestamp}</td>
              <td class="py-4 px-6 text-center text-sm sm:text-base">${post.likes || 0}</td>
              <td class="py-4 px-6 text-center">
                <button class="view-post bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600" data-id="${postId}">
                  보기
                </button>
                ${
                  (isAdmin || userStealItems > 0)
                    ? `<button class="steal-post bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 ml-2" data-id="${postId}">
                         뺏기
                       </button>`
                    : ""
                }
                ${
                  isAdmin
                    ? `<button class="delete-post bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 ml-2" data-id="${postId}">
                         삭제
                       </button>`
                    : ""
                }
              </td>
            `;

            postList.appendChild(row);
          });

          // 버튼 이벤트 추가
          document.querySelectorAll(".view-post").forEach((btn) => {
            btn.addEventListener("click", (e) => {
              const postId = e.target.dataset.id;
              viewPost(postId);
            });
          });

          document.querySelectorAll(".delete-post").forEach((btn) => {
            btn.addEventListener("click", (e) => {
              const postId = e.target.dataset.id;
              deletePost(postId);
            });
          });

          document.querySelectorAll(".steal-post").forEach((btn) => {
            btn.addEventListener("click", (e) => {
              const postId = e.target.dataset.id;
              stealPost(postId);
            });
          });
        } catch (error) {
          console.error("실시간 게시물 로딩 중 오류 발생:", error);
        }
      });
  } catch (error) {
    console.error("1등 사용자 가져오기 실패:", error);
  }
};
