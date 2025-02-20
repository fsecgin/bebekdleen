let wordList = []; // To store Turkish words
let targetWord = ""; // The word to guess
let guessesRemaining = 6;
let currentGuess = "";
let currentRow = 0;
const board = document.getElementById("game-board");
const keyboard = document.getElementById("keyboard");
let hintLetter = null; // this will hold the single hint letter for the current word
let didUseHint = false; // Track whether user used the hint

const serverStartTime = new Date(2025, 02, 20, 12, 0, 0); // 27 Dec 2024, 16:00
const FOUR_HOURS_IN_MS = 4 * 60 * 60 * 1000;

function getTimeBasedWord(wordArray) {
    const now = new Date();
  
    // How many milliseconds since start?
    const timeDiff = now - serverStartTime;
  
    // How many intervals?
    // If timeDiff is somehow negative, it’ll give a negative number,
    // but since we chose a past date, it won't happen in normal usage.
    const intervalsPassed = Math.floor(timeDiff / FOUR_HOURS_IN_MS);
  
    // Just in case, clamp to 0 if negative
    const safeIndex = Math.max(intervalsPassed, 0);
  
    // Wrap around if we exceed the word list length
    const index = safeIndex % wordArray.length;
  
    return wordArray[index];
  }

// Load the Turkish word list
async function loadWordList() {
  try {
    const response = await fetch("turkish-words-normalized.json"); // Load the JSON file
    wordList = await response.json();

    if (wordList.length === 0) {
      console.error("The word list is empty. Cannot start the game.");
      return;
    }
    displayRoundNumber();

    startGame(); // Start the game after loading the word list
  } catch (error) {
    console.error("Error loading word list:", error);
  }
}

// =============== NEW: Countdown utility ===============
/**
 * Creates a live-updating "countdown" element that shows
 * how many hours/minutes/seconds remain until the next 4-hour session.
 */
function createCountdownElement() {
    // Create the container for the countdown
    const countdownContainer = document.createElement("div");
    countdownContainer.style.marginTop = "20px";
    countdownContainer.style.textAlign = "center";
  
    // Create the countdown display (hh:mm:ss)
    const countdownSpan = document.createElement("div");
    countdownSpan.style.fontSize = "32px"; // Large and bold
    countdownSpan.style.fontWeight = "bold";
    countdownSpan.style.marginBottom = "8px";
  
    // Create the secondary text
    const nextText = document.createElement("div");
    nextText.textContent = "Sonraki Bebekdle İçin";
    nextText.style.fontSize = "14px"; // Smaller and lighter
    nextText.style.fontWeight = "lighter";
  
    // Add both elements to the container
    countdownContainer.appendChild(countdownSpan);
    countdownContainer.appendChild(nextText);
  
    // Function to update the countdown
    function updateCountdown() {
      const now = new Date();
      const timeDiff = now - serverStartTime;
      const intervalsPassed = Math.floor(timeDiff / FOUR_HOURS_IN_MS);
  
      // Calculate the next interval time
      const nextIntervalTime = new Date(
        serverStartTime.getTime() + (intervalsPassed + 1) * FOUR_HOURS_IN_MS
      );
  
      let msLeft = nextIntervalTime - now;
      if (msLeft < 0) msLeft = 0; // Clamp to 0 if time has passed
  
      const hours = String(Math.floor(msLeft / 3600000)).padStart(2, "0");
      msLeft %= 3600000;
      const minutes = String(Math.floor(msLeft / 60000)).padStart(2, "0");
      msLeft %= 60000;
      const seconds = String(Math.floor(msLeft / 1000)).padStart(2, "0");
  
      // Update the countdown span with the formatted time
      countdownSpan.textContent = `${hours}:${minutes}:${seconds}`;
    }
  
    // Update once immediately
    updateCountdown();
  
    // Then update every second
    const intervalId = setInterval(updateCountdown, 1000);
  
    // Optionally, clear interval when needed (e.g., when dialog is closed)
    countdownContainer.dataset.intervalId = intervalId;
  
    return countdownContainer;
  }
  
  function displayRoundNumber() {
    // Just to confirm it’s being called:
    console.log("displayRoundNumber called.");
  
    const now = new Date();
    const timeDiff = now - serverStartTime;
    const intervalsPassed = Math.floor(timeDiff / FOUR_HOURS_IN_MS);
  
    // If you want the first 4-hour block to be “R1”, add 1:
    const currentRound = intervalsPassed + 1;
  
    // Update the text content of #round-info
    const roundInfoEl = document.getElementById("round-info");
    if (roundInfoEl) {
      roundInfoEl.textContent = `R${currentRound}`;
    } else {
      console.warn("No #round-info element found in the DOM.");
    }
  }
  

// Start the game
function startGame() {
    targetWord = getTimeBasedWord(wordList);
    guessesRemaining = 6;
    currentGuess = "";
    currentRow = 0;
    hintLetter = null;
    didUseHint = false;    // Reset each new game

  
    // Clear the board and keyboard
    board.innerHTML = "";
    keyboard.innerHTML = "";
    generateBoard();
    generateKeyboard();
  
    // DEBUG: Doğru cevabı ekrana yazdır
    const debugDiv = document.getElementById("debug-answer");
    if (debugDiv) {
      debugDiv.textContent = `Doğru Cevap: ${targetWord}`;
    } else {
      console.error("Debug div (#debug-answer) bulunamadı!");
    }
  
    console.log("Target Word (Debug):", targetWord); // Debugging
  }
  
  

// Create the game board
function generateBoard() {
  for (let i = 0; i < 6; i++) {
    const row = document.createElement("div");
    row.classList.add("row");

    for (let j = 0; j < targetWord.length; j++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      row.appendChild(tile);
    }

    board.appendChild(row);
  }
}

// Create the on-screen keyboard with Turkish characters
function generateKeyboard() {
    const keyboardLayout = [
      "e r t y u ı o p ğ ü", // Top row
      "a s d f g h j k l ş i", // Middle row
      "enter z c v b n m ö ç delete" // Bottom row with repositioned keys
    ];
  
    keyboardLayout.forEach((row, rowIndex) => {
        const keyboardRow = document.createElement("div");
        keyboardRow.classList.add("keyboard-row");
        keyboardRow.classList.add(`keyboard-row-${rowIndex + 1}`); // Add specific class for the row
  
      row.split(" ").forEach((key) => {
        const keyButton = document.createElement("button");
        keyButton.textContent = key.toLocaleUpperCase("tr-TR")
        keyButton.classList.add("key");
  
        if (key === "delete") {
          keyButton.setAttribute("data-action", "delete");
          keyButton.textContent = "◀"; // Adjust label for clarity
          keyButton.onclick = deleteLetter;
        } else if (key === "enter") {
          keyButton.setAttribute("data-action", "enter");
          keyButton.textContent = "➤";
          keyButton.onclick = submitGuess;
        } else {
          keyButton.onclick = () => handleKeyPress(key);
        }
  
        keyboardRow.appendChild(keyButton);
      });
  
      keyboard.appendChild(keyboardRow);
    });
  }
  

// Handle key press (physical or on-screen)
function handleKeyPress(letter) {
    if (currentGuess.length < targetWord.length && guessesRemaining > 0) {
      currentGuess += letter; // Tahmin güncelleniyor
      updateTiles(); // Doğru satırın güncellenmesini sağlar
  
      const row = board.children[currentRow];
      const tiles = row.children;
  
      // Yeni harfin olduğu tile'a focus ekle
      const currentTile = tiles[currentGuess.length - 1];
      if (currentTile) {
        Array.from(tiles).forEach((tile) => tile.classList.remove("focused"));
        currentTile.classList.add("focused", "filled");
      }
    }
  }
  

// Update the tiles based on the current guess
function updateTiles() {
    const row = board.children[currentRow]; // Doğru satır seçiliyor
    const tiles = row.children;
  
    for (let i = 0; i < targetWord.length; i++) {
        tiles[i].textContent = currentGuess[i]
        ? currentGuess[i].toLocaleUpperCase("tr-TR")
        : ""; // Tile'a harf ekleniyor
    }
  }
  

// Delete the last letter
function deleteLetter() {
    if (currentGuess.length > 0) {
      currentGuess = currentGuess.slice(0, -1);
      updateTiles();
  
      const row = board.children[currentRow];
      const tiles = row.children;
  
      // Silinen harf için border'ı kaldır ve bir önceki tile'a focus ekle
      const previousTile = tiles[currentGuess.length];
      if (previousTile) {
        Array.from(tiles).forEach((tile) => tile.classList.remove("focused"));
  
        // Bir önceki tile'a "focused" ekle ama "filled" kaldır
        previousTile.classList.add("focused");
        previousTile.classList.remove("filled");
      }
    }
  }
  

function findKeyButton(letter) {
    const keyboardKeys = document.querySelectorAll(".keyboard-row .key");
    const key = Array.from(keyboardKeys).find(
      (key) => key.textContent.trim().toLocaleLowerCase("tr-TR") === letter.toLocaleLowerCase("tr-TR")
    );
  
    // Log işlemi: Hangi tuş seçildi veya bulunamadı?
    if (key) {
      console.log(`Key found for letter "${letter}":`, key.textContent);
    } else {
      console.log(`Key NOT found for letter "${letter}"`);
    }
  
    return key;
  }
  

// Submit the guess
function submitGuess() {
    if (currentGuess.length !== targetWord.length) {
      // 1) Snackbar göster
      showSnackbar("It’s 5 letters, love... 😅");
      
      // 2) Shake animasyonu
      const row = board.children[currentRow];
      const tiles = row.children;
      
      for (let i = 0; i < tiles.length; i++) {
        tiles[i].classList.add("shake");
      }
    
      // Animasyonun süresi 0.3s, bunu bitince temizleyeceğiz
      setTimeout(() => {
        for (let i = 0; i < tiles.length; i++) {
          tiles[i].classList.remove("shake");
        }
      }, 200);
    
      return;
    }
  
    if (!wordList.includes(currentGuess)) {
        // 1) Snackbar göster
        showSnackbar("That word doesn’t exist babe 😩");
      
        // 2) Shake animasyonu
        const row = board.children[currentRow];
        const tiles = row.children;
        
        for (let i = 0; i < tiles.length; i++) {
          tiles[i].classList.add("shake");
        }
      
        // Animasyonun süresi 0.3s, bunu bitince temizleyeceğiz
        setTimeout(() => {
          for (let i = 0; i < tiles.length; i++) {
            tiles[i].classList.remove("shake");
          }
        }, 200);
      
        return;
      }
      
  
    const row = board.children[currentRow];
    const tiles = row.children;
  
    const targetWordUsage = Array(targetWord.length).fill(false);
  
    // 1. Doğru pozisyonları (correct) işaretle
    for (let i = 0; i < targetWord.length; i++) {
      const letter = currentGuess[i];
      if (letter === targetWord[i]) {
        targetWordUsage[i] = true; // Harfi işaretle
      }
    }
  
    // 2. Flip ve durum kontrolü
    for (let i = 0; i < targetWord.length; i++) {
      const letter = currentGuess[i];
      const tile = tiles[i];
      const keyButton = findKeyButton(letter);
  
      setTimeout(() => {
        tile.classList.add("flip");
  
        setTimeout(() => {
          if (letter === targetWord[i]) {
            tile.classList.add("correct");
            if (keyButton) {
              keyButton.classList.remove("present", "absent");
              keyButton.classList.add("correct");
            }
          } else {
            const unusedIndex = targetWord.split("").findIndex(
              (char, idx) => char === letter && !targetWordUsage[idx]
            );
  
            if (unusedIndex !== -1) {
              tile.classList.add("present");
              targetWordUsage[unusedIndex] = true;
              if (keyButton && !keyButton.classList.contains("correct")) {
                keyButton.classList.remove("absent");
                keyButton.classList.add("present");
              }
            } else {
              tile.classList.add("absent");
              if (keyButton && !keyButton.classList.contains("correct") && !keyButton.classList.contains("present")) {
                keyButton.classList.add("absent");
              }
            }
          }
  
          tile.classList.remove("flip");
        }, 500);
      }, i * 300);
    }
  
    // Tahmin tamamlandıktan sonra kontrol
    setTimeout(() => {
      clearBordersFromRow(row);
  
      if (currentGuess === targetWord) {
        openWinDialog(currentRow + 1); // row index is 0-based, so +1 is attempts used
        return;
      }
  
      guessesRemaining--;
      currentRow++; // Yeni satır aktif hale getiriliyor
      currentGuess = "";
  
      // Yeni satıra geçiş
      if (currentRow < board.children.length) {
        moveToNextRow();
      }
  
      if (guessesRemaining === 0) {
        openLoseDialog(targetWord);
      }
    }, targetWord.length * 300 + 500);
  }

  function buildEmojiGrid(rowsUsed) {
    // We'll build an array of strings, one per row
    const rows = [];
    
    // We only go up to `rowsUsed` rows (i.e., if user won on the 3rd row, we show 3 rows)
    for (let r = 0; r < rowsUsed; r++) {
      const rowElement = board.children[r];
      const tiles = rowElement.children;
      
      let rowStr = "";
      for (let t = 0; t < tiles.length; t++) {
        const tile = tiles[t];
        if (tile.classList.contains("correct")) {
          rowStr += "🟩";
        } else if (tile.classList.contains("present")) {
          rowStr += "🟨";
        } else {
          rowStr += "⬜";
        }
      }
      
      rows.push(rowStr);
    }
    
    // Join rows by newline
    return rows.join("\n");
  }

  function openWinDialog(rowsUsed) {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "win-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = 9999;
  
    // Create dialog container
    const dialog = document.createElement("div");
    dialog.id = "win-dialog";
    dialog.style.background = "linear-gradient(135deg, #f9f9f9, #efefef)";
    dialog.style.padding = "24px";
    dialog.style.borderRadius = "10px";
    dialog.style.maxWidth = "320px";
    dialog.style.textAlign = "center";
    dialog.style.fontFamily = "'Quicksand', sans-serif";
    dialog.style.color = "#333";
    dialog.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
  
    // Create the GIF
    const gifImg = document.createElement("img");
    gifImg.src =
      "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHJ6dmFudTNiaGVneXdzZ2JlOHJ3cGRhMXA3OWlidm9oZjZoMHphdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/NfzERYyiWcXU4/giphy.webp";
    gifImg.style.maxWidth = "100%";
    gifImg.style.height = "auto";
    gifImg.alt = "Win GIF";
    gifImg.style.marginBottom = "16px";
  
    // Create the main text
    const winText = document.createElement("p");
    winText.textContent = "💖💖💖 WELL DONE BABY, THAT’S THE RIGHT ANSWER! 💖💖💖";
    winText.style.fontSize = "1.1rem";
    winText.style.fontWeight = "600";
    winText.style.lineHeight = "1.4";
    winText.style.marginBottom = "24px";
  
    // Create SHARE button
    const shareButton = document.createElement("button");
    shareButton.textContent = "SHARE 📤";
    shareButton.style.backgroundColor = "pink";
    shareButton.onclick = () => {
      shareResultsNative(rowsUsed);
    };
    styleWinButton(shareButton);
  
    // =============== NEW: Append countdown ===============
    const countdown = createCountdownElement();
    countdown.style.marginBottom = "12px";
    // =====================================================
  
    // Assemble
    dialog.appendChild(gifImg);
    dialog.appendChild(winText);
    dialog.appendChild(countdown);
    dialog.appendChild(shareButton);
  
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }
  
  function shareResultsNative(rowsUsed) {
    // 1) Build the emoji grid from the used rows
    const gridString = buildEmojiGrid(rowsUsed);
  
    // 2) "Bebekdle Türkçe X/6" (X is the row used)
    const roundText = document.getElementById("round-info")?.textContent || "";
    const resultLine = `Bebekdle ${roundText} ${rowsUsed}/6`; 
  
    // 3) Did we use a hint?
    const hintLine = didUseHint
      ? "I used a hint 👺"
      : "I didn't use a hint 😎";
  
    // 4) Put it all together
    const finalText = [
      resultLine,
      hintLine,
      gridString,
      "https://fsecgin.github.io/bebekdle/"
    ].join("\n\n");
  
    // 5) Use the Web Share API if available
    if (navigator.share) {
      navigator.share({
        text: finalText, // You can also include a `title` or `url` here if you want
      })
      .then(() => {
        console.log("Paylaşım başarılı!");
      })
      .catch((error) => {
        console.log("Paylaşım iptal veya hata:", error);
      });
    } else {
      // Fallback: e.g., show an alert
      alert(
        "Paylaşma özelliği bu tarayıcıda desteklenmiyor.\n\n" +
        "Paylaşmak istediğiniz metin:\n\n" +
        finalText
      );
    }
  }
  

  function styleWinButton(button) {
    button.style.display = "block";
    button.style.width = "100%";
    button.style.margin = "0 auto";
    button.style.backgroundColor = "#f01c6e";
    button.style.color = "#fff";
    button.style.border = "none";
    button.style.padding = "16px 0";
    button.style.borderRadius = "8px";
    button.style.cursor = "pointer";
    button.style.fontSize = "1rem";
    button.style.transition = "background-color 0.2s ease-in-out";
    button.style.fontFamily = "'Quicksand', sans-serif";
    button.style.fontWeight = "600";
  
    button.onmouseover = () => {
      button.style.backgroundColor = darkenColor("#f01c6e", 20);
    };
    button.onmouseout = () => {
      button.style.backgroundColor = "#f01c6e";
    };
  }

  function copyShareResultsToClipboard(rowsUsed) {
    // 1) Build the emoji grid from the used rows
    const gridString = buildEmojiGrid(rowsUsed);
  
    // 2) "Bebekdle Türkçe X/6" (X is the row used)
    const resultLine = `Bebekdle Türkçe ${rowsUsed}/6`;
  
    // 3) Did we use a hint?
    const hintLine = didUseHint
      ? "I used a hint 👺"
      : "I didn’t use a hint 😎";
  
    // 4) Put all together
    const finalText = [
      resultLine,
      hintLine,
      gridString,
      "https://wordleturkce.bundle.app/"
    ].join("\n\n"); // extra newlines between sections
  
    // 5) Use the Clipboard API
    navigator.clipboard.writeText(finalText)
      .then(() => {
        alert("Paylaşıldı! Sonuçlar panoya kopyalandı.");
      })
      .catch(() => {
        alert("Kopyalama başarısız oldu. Lütfen tekrar deneyin.");
      });
  }
  
  
  function clearBordersFromRow(row) {
    const tiles = row.children;
    for (let i = 0; i < tiles.length; i++) {
      tiles[i].classList.remove("focused");
      tiles[i].classList.remove("filled");
      // Eğer border'ı veren başka bir class varsa, onu da burada remove edin.
    }
  }
  
  
  
  function moveToNextRow() {
    const nextRow = board.children[currentRow]; // Yeni satır
    if (nextRow) {
      const tiles = nextRow.children;
  
      // Yeni satırın ilk harfine focus ekle
      Array.from(tiles).forEach((tile) => tile.classList.remove("focused")); // Tüm odakları temizle
      tiles[0].classList.add("focused"); // Yeni satırın ilk tile'ına odaklan
    }
  }
  

  
// Show a popup message
function showPopup(message) {
  const overlay = document.createElement("div");
  overlay.id = "popup-overlay";

  const popup = document.createElement("div");
  popup.id = "popup";

  const popupMessage = document.createElement("p");
  popupMessage.textContent = message;

  const playAgainButton = document.createElement("button");
  playAgainButton.textContent = "Play Again";
  playAgainButton.onclick = () => {
    document.body.removeChild(overlay);
    startGame();
  };

  popup.appendChild(popupMessage);
  popup.appendChild(playAgainButton);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

function showSnackbar(message, duration = 3000) {
    const snackbar = document.getElementById("snackbar");
    if (!snackbar) return;
  
    snackbar.textContent = message;
    snackbar.classList.add("show");
  
    // Belirli bir süre sonra snackbar'ı kapat
    setTimeout(() => {
      snackbar.classList.remove("show");
    }, duration);
  }

  document.getElementById("info-icon").addEventListener("click", openInfoDialog);
  
  document.getElementById("hint-icon").addEventListener("click", function() {
    openHintDialog();
  });
  
  
  function openHintDialog() {
    // Create an overlay
    const overlay = document.createElement("div");
    overlay.id = "hint-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)"; // Darker overlay
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = 9999;
  
    // Create the dialog container
    const dialog = document.createElement("div");
    dialog.id = "hint-dialog";
    // Subtle gradient or pick any background color
    dialog.style.background = "linear-gradient(135deg, #f9f9f9, #efefef)";
    dialog.style.padding = "24px";
    dialog.style.borderRadius = "10px";
    dialog.style.maxWidth = "320px";
    dialog.style.textAlign = "center";
    dialog.style.fontFamily = "'Quicksand', sans-serif";
    dialog.style.fontWeight = "800";
    dialog.style.color = "#333";
    dialog.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
  
    // Create an <img> for the GIF
    const gifImg = document.createElement("img");
    gifImg.src = "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmFiYjB1ZGx6bDJldWhkYWszNXNhbGN1NGY1ZGFycXVobXVlZWZ3dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XVbQsIjdXDNyswwxOO/200.webp";
    gifImg.style.maxWidth = "100%";
    gifImg.style.height = "auto";
    gifImg.alt = "Hint GIF";
    gifImg.style.marginBottom = "16px";
  
    // Create the text
    const hintText = document.createElement("p");
    hintText.textContent = "Too hard? 😼 Say GIVE ME A LETTER and I’ll reveal one!";
    hintText.style.fontSize = "1.1rem";
    hintText.style.lineHeight = "1.4";
    hintText.style.marginBottom = "24px";
  
    // Create the buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.justifyContent = "space-between";
    buttonsContainer.style.marginTop = "12px";
  
    // Create 'HARF ALAYIM' button
    const revealButton = document.createElement("button");
    revealButton.textContent = "GIVE ME A LETTER";
    revealButton.onclick = () => {
      revealRandomLetter();
      didUseHint = true; // The user definitely used a hint now
      document.body.removeChild(overlay);
    };
    styleDialogButton(revealButton, "#f01c6e");
  
    // Create 'KENDİM ÇÖZERİM BE' button
    const closeButton = document.createElement("button");
    closeButton.textContent = "I’LL FIGURE IT OUT MYSELF";
    closeButton.onclick = () => {
      document.body.removeChild(overlay);
    };
    styleDialogButton(closeButton, "#444444");
  
    // Assemble
    buttonsContainer.appendChild(revealButton);
    buttonsContainer.appendChild(closeButton);
  
    dialog.appendChild(gifImg);
    dialog.appendChild(hintText);
    dialog.appendChild(buttonsContainer);
    overlay.appendChild(dialog);
  
    document.body.appendChild(overlay);
  }
  
  // Helper function to style buttons consistently
  function styleDialogButton(button, bgColor) {
    button.style.backgroundColor = bgColor;
    button.style.color = "#fff";
    button.style.border = "none";
    button.style.padding = "10px 16px";
    button.style.borderRadius = "6px";
    button.style.cursor = "pointer";
    button.style.fontSize = "0.9rem";
    button.style.transition = "background-color 0.2s ease-in-out";
    button.style.fontFamily = "'Quicksand', sans-serif";
    button.style.fontWeight = "600";
  
    button.onmouseover = () => {
      button.style.backgroundColor = darkenColor(bgColor, 20);
    };
    button.onmouseout = () => {
      button.style.backgroundColor = bgColor;
    };
  }
  
  // Helper to darken a hex color by a given percentage
  function darkenColor(hex, percent) {
    // Remove '#' if present
    let color = hex.replace("#", "");
    if (color.length === 3) {
      // Convert 3-digit hex to 6-digit
      color =
        color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) - Math.round(2.55 * percent);
    let g = ((num >> 8) & 0x00ff) - Math.round(2.55 * percent);
    let b = (num & 0x0000ff) - Math.round(2.55 * percent);
  
    // Clamp each value between 0 and 255
    if (r < 0) r = 0; if (g < 0) g = 0; if (b < 0) b = 0;
    return "#" + (b | (g << 8) | (r << 16)).toString(16).padStart(6, "0");
  }
  
  function revealRandomLetter() {
    // If we already selected a hint letter, check if the user has guessed it
    if (hintLetter) {
      // If user already guessed that hint letter, display the "already found" message.
      if (hasUserGuessedLetter(hintLetter)) {
        alert("BABE YOU’VE ALREADY FOUND THE HINT 🕵");
        return;
      } else {
        // Otherwise, show them the same hint letter again
        alert(`HERE’S YOUR LETTER ${hintLetter.toLocaleUpperCase("tr-TR")} — DON’T SPEND IT ALL AT ONCE 👽`);
        return;
      }
    }
  
    // =========== If we get here, it means hintLetter is null and we haven't chosen one yet ==========
  
    // 1) Gather guessed letters so far
    let guessedLetters = new Set();
    for (let r = 0; r < currentRow; r++) {
      const rowElement = board.children[r];
      const tiles = rowElement.children;
      let guessedWord = "";
      for (let t = 0; t < tiles.length; t++) {
        guessedWord += tiles[t].textContent.trim().toLocaleLowerCase("tr-TR");
      }
      for (let char of guessedWord) {
        guessedLetters.add(char);
      }
    }
  
    // 2) Build an array of unrevealed letters from targetWord
    const unrevealedLetters = [];
    for (let i = 0; i < targetWord.length; i++) {
      const letter = targetWord[i].toLocaleLowerCase("tr-TR");
      if (!guessedLetters.has(letter)) {
        unrevealedLetters.push(letter);
      }
    }
  
    if (unrevealedLetters.length === 0) {
      // Means user has already guessed all letters in some form
      alert("BABE YOU’VE ALREADY FOUND THE HINT 🕵");
      return;
    }
  
    // 3) Randomly pick one letter from that unrevealed list (only once)
    const randomIndex = Math.floor(Math.random() * unrevealedLetters.length);
    hintLetter = unrevealedLetters[randomIndex]; // Store globally
  
    // 4) Show it to the user
    alert(`MEMEDALİNİN ${hintLetter.toLocaleUpperCase("tr-TR")} Sİ 👽`);
  }

  function hasUserGuessedLetter(letter) {
    letter = letter.toLocaleLowerCase("tr-TR"); // normalize
    for (let r = 0; r < currentRow; r++) {
      const rowElement = board.children[r];
      const tiles = rowElement.children;
      for (let t = 0; t < tiles.length; t++) {
        if (tiles[t].textContent.trim().toLocaleLowerCase("tr-TR") === letter) {
          return true; // Found the letter in the guesses
        }
      }
    }
    return false;
  }
  
  

  function openInfoDialog() {
    // Create an overlay
    const overlay = document.createElement("div");
    overlay.id = "info-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)"; // Dark overlay
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = 9999;
  
    // Create the dialog container
    const dialog = document.createElement("div");
    dialog.id = "info-dialog";
    dialog.style.background = "linear-gradient(135deg, #f9f9f9, #efefef)";
    dialog.style.padding = "24px";
    dialog.style.borderRadius = "10px";
    dialog.style.maxWidth = "320px";
    dialog.style.textAlign = "center";
    dialog.style.fontFamily = "'Quicksand', sans-serif";
    dialog.style.fontWeight = "800";
    dialog.style.color = "#333";
    dialog.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
  
    // Create an <img> for the GIF
    const gifImg = document.createElement("img");
    gifImg.src = "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTh6NzQ0eGhhZnY3azg3aGV6bDUxdmNvdHQ5ZXh5M203a2YweXI5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MDJ9IbxxvDUQM/giphy.webp";
    gifImg.style.maxWidth = "100%";
    gifImg.style.height = "auto";
    gifImg.alt = "Info GIF";
    gifImg.style.marginBottom = "16px";
  
    // Create the text
    const infoText = document.createElement("p");
    infoText.textContent = "Designed with love... so we can spend more time together.";
    infoText.style.fontSize = "1.1rem";
    infoText.style.lineHeight = "1.4";
    infoText.style.marginBottom = "24px";
  
    // Create a single big button with a heart emoji
    const heartButton = document.createElement("button");
    heartButton.textContent = "❤️";
    heartButton.onclick = () => {
      document.body.removeChild(overlay);
    };
  
    // Style the button
    styleInfoButton(heartButton);
  
    // Assemble
    dialog.appendChild(gifImg);
    dialog.appendChild(infoText);
    dialog.appendChild(heartButton);
    overlay.appendChild(dialog);
  
    document.body.appendChild(overlay);
  }
  
  /**
   * A helper function to style the big heart button.
   * You can tweak colors, padding, fonts, etc. as you wish.
   */
  function styleInfoButton(button) {
    button.style.display = "block";
    button.style.width = "100%";          // Make it wide
    button.style.margin = "0 auto";       // Center it horizontally
    button.style.backgroundColor = "#f01c6e";
    button.style.color = "#fff";
    button.style.border = "none";
    button.style.padding = "16px 0";      // Tall enough to be easy to press
    button.style.borderRadius = "8px";
    button.style.cursor = "pointer";
    button.style.fontSize = "1.5rem";     // Larger emoji
    button.style.transition = "background-color 0.2s ease-in-out";
    button.style.fontFamily = "'Quicksand', sans-serif";
    button.style.fontWeight = "600";
  
    button.onmouseover = () => {
      button.style.backgroundColor = darkenColor("#f01c6e", 20);
    };
    button.onmouseout = () => {
      button.style.backgroundColor = "#f01c6e";
    };
  }
  
  // Reuse the same color-darkening helper from your hint dialog, if desired
  function darkenColor(hex, percent) {
    let color = hex.replace("#", "");
    if (color.length === 3) {
      color =
        color[0] + color[0] +
        color[1] + color[1] +
        color[2] + color[2];
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) - Math.round(2.55 * percent);
    let g = ((num >> 8) & 0x00ff) - Math.round(2.55 * percent);
    let b = (num & 0x0000ff) - Math.round(2.55 * percent);
  
    if (r < 0) r = 0; if (g < 0) g = 0; if (b < 0) b = 0;
    return "#" + (b | (g << 8) | (r << 16)).toString(16).padStart(6, "0");
  }

  function openLoseDialog(answer) {
    // Create an overlay
    const overlay = document.createElement("div");
    overlay.id = "lose-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = 9999;
  
    // Create the dialog container
    const dialog = document.createElement("div");
    dialog.id = "lose-dialog";
    dialog.style.background = "linear-gradient(135deg, #f9f9f9, #efefef)";
    dialog.style.padding = "24px";
    dialog.style.borderRadius = "10px";
    dialog.style.maxWidth = "320px";
    dialog.style.textAlign = "center";
    dialog.style.fontFamily = "'Quicksand', sans-serif";
    dialog.style.color = "#333";
    dialog.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
  
    // Create an <img> for the GIF
    const gifImg = document.createElement("img");
    gifImg.src =
      "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZWVta3E4dWMza3BlanNyNjRvaDFiZHR4ZW85eW95OG51d213c3NtciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/uUvyQdPSl8dhu/giphy.webp";
    gifImg.style.maxWidth = "100%";
    gifImg.style.height = "auto";
    gifImg.alt = "Lose GIF";
    gifImg.style.marginBottom = "16px";
  
    // Create the text container
    const loseTextContainer = document.createElement("div");
  
    // Create main text
    const mainText = document.createElement("p");
    mainText.textContent = "Sadly, we couldn’t guess it...";
    mainText.style.marginBottom = "8px";
  
    // Create answer text (the actual 'cevap')
    const answerText = document.createElement("p");
    answerText.textContent = `'${answer.toLocaleUpperCase("tr-TR")}'`;
    answerText.style.fontWeight = "bold";
    answerText.style.marginBottom = "8px";
  
    // Create final line
    const finalLine = document.createElement("p");
    finalLine.textContent = "So this was the answer... That’s not even a real word, wtf!";
    finalLine.style.marginBottom = "16px";
  
    loseTextContainer.appendChild(mainText);
    loseTextContainer.appendChild(answerText);
    loseTextContainer.appendChild(finalLine);
  
    // Create the button
    const catButton = document.createElement("button");
    catButton.textContent = "😾";
    catButton.onclick = () => {
      document.body.removeChild(overlay);
    };
  
    // Style the button
    styleLoseButton(catButton);
  
    // =============== Display Countdown ===============
    const countdownContainer = document.createElement("div");
    countdownContainer.style.marginTop = "16px";
  
    const countdownElement = createCountdownElement(); // Use your existing function
  
    // Style the countdown
    countdownElement.style.fontSize = "32px";
    countdownElement.style.fontWeight = "bold";
    countdownElement.style.marginBottom = "8px";
    countdownElement.style.textAlign = "center";
  
    const nextText = document.createElement("div");
    nextText.textContent = "Sonraki Bebekdle İçin";
    nextText.style.fontSize = "14px";
    nextText.style.fontWeight = "lighter";
    nextText.style.textAlign = "center";
  
    countdownContainer.appendChild(countdownElement);
    // =================================================
  
    // Assemble
    dialog.appendChild(gifImg);
    dialog.appendChild(loseTextContainer);
    dialog.appendChild(countdownContainer);
    dialog.appendChild(catButton);
  
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }
  
  
  function styleLoseButton(button) {
    button.style.display = "block";
    button.style.width = "100%";
    button.style.margin = "0 auto";
    button.style.backgroundColor = "#f01c6e";
    button.style.color = "#fff";
    button.style.border = "none";
    button.style.padding = "16px 0";
    button.style.borderRadius = "8px";
    button.style.cursor = "pointer";
    button.style.fontSize = "1.5rem";
    button.style.transition = "background-color 0.2s ease-in-out";
    button.style.fontFamily = "'Quicksand', sans-serif";
    button.style.fontWeight = "600";
  
    button.onmouseover = () => {
      button.style.backgroundColor = darkenColor("#f01c6e", 20);
    };
    button.onmouseout = () => {
      button.style.backgroundColor = "#f01c6e";
    };
  }
  
  // Reuse the same color-darkening helper you have:
  function darkenColor(hex, percent) {
    let color = hex.replace("#", "");
    if (color.length === 3) {
      color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) - Math.round(2.55 * percent);
    let g = ((num >> 8) & 0xff) - Math.round(2.55 * percent);
    let b = (num & 0xff) - Math.round(2.55 * percent);
    
    if (r < 0) r = 0; if (g < 0) g = 0; if (b < 0) b = 0;
    return "#" + (b | (g << 8) | (r << 16)).toString(16).padStart(6, "0");
  }
  
  
// Physical keyboard input
document.addEventListener("keydown", (event) => {
  const key = event.key.toLocaleLowerCase("tr-TR");
  if (key === "enter") {
    submitGuess();
  } else if (key === "backspace") {
    deleteLetter();
  } else if (/^[a-zğüşıçö]$/.test(key)) {
    handleKeyPress(key);
  }
});

// Initialize the game by loading the word list
loadWordList();
