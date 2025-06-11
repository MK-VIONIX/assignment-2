document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const board = document.getElementById('sudoku-board');
    const newGameBtn = document.getElementById('new-game');
    const checkSolutionBtn = document.getElementById('check-solution');
    const resetBtn = document.getElementById('reset');
    const hintBtn = document.getElementById('hint');
    const difficultyBtn = document.getElementById('difficulty');
    const timerDisplay = document.getElementById('timer');
    const puzzlesSolvedDisplay = document.getElementById('puzzles-solved');
    const resetModal = document.getElementById('reset-modal');
    const confirmResetBtn = document.getElementById('confirm-reset');
    const cancelResetBtn = document.getElementById('cancel-reset');
    const successModal = document.getElementById('success-modal');
    const closeSuccessBtn = document.getElementById('close-success');
    const completionTimeDisplay = document.getElementById('completion-time');

    // Game state
    let sudokuGrid = Array(9).fill().map(() => Array(9).fill(0));
    let solutionGrid = Array(9).fill().map(() => Array(9).fill(0));
    let fixedCells = Array(9).fill().map(() => Array(9).fill(false));
    let selectedCell = null;
    let timer = null;
    let seconds = 0;
    let puzzlesSolved = parseInt(localStorage.getItem('puzzlesSolved')) || 0;
    let difficulty = 'medium'; // easy, medium, hard

    // Initialize the game
    init();

    function init() {
        createBoard();
        loadStats();
        newGame();
        setupEventListeners();
    }

    function createBoard() {
        board.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.dataset.row = i;
                input.dataset.col = j;
                
                cell.appendChild(input);
                board.appendChild(cell);
            }
        }
    }

    function setupEventListeners() {
        // Board input handling
        board.addEventListener('input', handleCellInput);
        board.addEventListener('click', handleCellClick);
        document.addEventListener('keydown', handleKeyDown);

        // Button events
        newGameBtn.addEventListener('click', newGame);
        checkSolutionBtn.addEventListener('click', checkSolution);
        resetBtn.addEventListener('click', showResetModal);
        hintBtn.addEventListener('click', giveHint);
        difficultyBtn.addEventListener('click', toggleDifficulty);

        // Modal events
        confirmResetBtn.addEventListener('click', resetPuzzle);
        cancelResetBtn.addEventListener('click', hideResetModal);
        closeSuccessBtn.addEventListener('click', () => {
            successModal.style.display = 'none';
            newGame();
        });
    }

    function newGame() {
        stopTimer();
        seconds = 0;
        updateTimerDisplay();
        
        generateSudoku();
        renderBoard();
        startTimer();
    }

    function generateSudoku() {
        // Generate a complete solution
        solutionGrid = generateSolution();
        
        // Create a puzzle by removing numbers
        sudokuGrid = Array(9).fill().map(() => Array(9).fill(0));
        fixedCells = Array(9).fill().map(() => Array(9).fill(false));
        
        let cellsToFill;
        switch(difficulty) {
            case 'easy':
                cellsToFill = 45; // About 20 empty cells
                break;
            case 'hard':
                cellsToFill = 30; // About 50 empty cells
                break;
            case 'medium':
            default:
                cellsToFill = 36; // About 35 empty cells
        }
        
        // Fill the cells
        let filledCells = 0;
        while (filledCells < cellsToFill) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            
            if (sudokuGrid[row][col] === 0) {
                sudokuGrid[row][col] = solutionGrid[row][col];
                fixedCells[row][col] = true;
                filledCells++;
            }
        }
    }

    function generateSolution() {
        // Create an empty grid
        const grid = Array(9).fill().map(() => Array(9).fill(0));
        
        // Fill the diagonal 3x3 boxes (they are independent)
        fillDiagonalBoxes(grid);
        
        // Solve the rest of the grid
        solveSudoku(grid);
        
        return grid;
    }

    function fillDiagonalBoxes(grid) {
        for (let box = 0; box < 9; box += 3) {
            fillBox(grid, box, box);
        }
    }

    function fillBox(grid, row, col) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffleArray(nums);
        
        let index = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                grid[row + i][col + j] = nums[index++];
            }
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function solveSudoku(grid) {
        const emptyCell = findEmptyCell(grid);
        if (!emptyCell) return true; // Puzzle solved
        
        const [row, col] = emptyCell;
        
        for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(grid, row, col, num)) {
                grid[row][col] = num;
                
                if (solveSudoku(grid)) {
                    return true;
                }
                
                grid[row][col] = 0; // Backtrack
            }
        }
        
        return false; // No solution found
    }

    function findEmptyCell(grid) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (grid[i][j] === 0) {
                    return [i, j];
                }
            }
        }
        return null;
    }

    function isValidPlacement(grid, row, col, num) {
        // Check row
        for (let j = 0; j < 9; j++) {
            if (grid[row][j] === num) return false;
        }
        
        // Check column
        for (let i = 0; i < 9; i++) {
            if (grid[i][col] === num) return false;
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[boxRow + i][boxCol + j] === num) return false;
            }
        }
        
        return true;
    }

    function renderBoard() {
        clearHighlights();
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = getCellElement(i, j);
                const input = cell.querySelector('input');
                
                if (fixedCells[i][j]) {
                    cell.classList.add('fixed');
                    input.value = sudokuGrid[i][j] !== 0 ? sudokuGrid[i][j] : '';
                    input.readOnly = true;
                } else {
                    cell.classList.remove('fixed');
                    input.value = sudokuGrid[i][j] !== 0 ? sudokuGrid[i][j] : '';
                    input.readOnly = false;
                }
            }
        }
    }

    function getCellElement(row, col) {
        return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    }

    function handleCellInput(e) {
        if (!e.target.matches('input')) return;
        
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        
        // Allow only numbers 1-9
        const value = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = value;
        
        sudokuGrid[row][col] = value ? parseInt(value) : 0;
        
        // Validate the board after each input
        validateBoard();
    }

    function handleCellClick(e) {
        const cell = e.target.closest('.cell');
        if (!cell) return;
        
        clearHighlights();
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (!fixedCells[row][col]) {
            cell.classList.add('highlight');
            selectedCell = [row, col];
        }
    }

    function handleKeyDown(e) {
        if (!selectedCell) return;
        
        const [row, col] = selectedCell;
        const input = getCellElement(row, col).querySelector('input');
        
        if (e.key >= '1' && e.key <= '9') {
            input.value = e.key;
            sudokuGrid[row][col] = parseInt(e.key);
            validateBoard();
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            input.value = '';
            sudokuGrid[row][col] = 0;
            validateBoard();
        } else if (e.key.startsWith('Arrow')) {
            moveSelection(e.key);
        }
    }

    function moveSelection(direction) {
        if (!selectedCell) return;
        
        let [row, col] = selectedCell;
        
        switch(direction) {
            case 'ArrowUp':
                row = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                row = Math.min(8, row + 1);
                break;
            case 'ArrowLeft':
                col = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                col = Math.min(8, col + 1);
                break;
        }
        
        if (!fixedCells[row][col]) {
            clearHighlights();
            const cell = getCellElement(row, col);
            cell.classList.add('highlight');
            selectedCell = [row, col];
            cell.querySelector('input').focus();
        }
    }

    function clearHighlights() {
        document.querySelectorAll('.cell.highlight').forEach(cell => {
            cell.classList.remove('highlight');
        });
        selectedCell = null;
    }

    function validateBoard() {
        let hasErrors = false;
        
        // Clear previous errors
        document.querySelectorAll('.cell.error').forEach(cell => {
            cell.classList.remove('error');
        });
        
        // Check rows
        for (let i = 0; i < 9; i++) {
            const rowNumbers = new Set();
            for (let j = 0; j < 9; j++) {
                const num = sudokuGrid[i][j];
                if (num !== 0) {
                    if (rowNumbers.has(num)) {
                        // Mark all duplicates in the row
                        for (let k = 0; k < 9; k++) {
                            if (sudokuGrid[i][k] === num) {
                                getCellElement(i, k).classList.add('error');
                                hasErrors = true;
                            }
                        }
                    }
                    rowNumbers.add(num);
                }
            }
        }
        
        // Check columns
        for (let j = 0; j < 9; j++) {
            const colNumbers = new Set();
            for (let i = 0; i < 9; i++) {
                const num = sudokuGrid[i][j];
                if (num !== 0) {
                    if (colNumbers.has(num)) {
                        // Mark all duplicates in the column
                        for (let k = 0; k < 9; k++) {
                            if (sudokuGrid[k][j] === num) {
                                getCellElement(k, j).classList.add('error');
                                hasErrors = true;
                            }
                        }
                    }
                    colNumbers.add(num);
                }
            }
        }
        
        // Check 3x3 boxes
        for (let boxRow = 0; boxRow < 9; boxRow += 3) {
            for (let boxCol = 0; boxCol < 9; boxCol += 3) {
                const boxNumbers = new Set();
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        const num = sudokuGrid[boxRow + i][boxCol + j];
                        if (num !== 0) {
                            if (boxNumbers.has(num)) {
                                // Mark all duplicates in the box
                                for (let k = 0; k < 3; k++) {
                                    for (let l = 0; l < 3; l++) {
                                        if (sudokuGrid[boxRow + k][boxCol + l] === num) {
                                            getCellElement(boxRow + k, boxCol + l).classList.add('error');
                                            hasErrors = true;
                                        }
                                    }
                                }
                            }
                            boxNumbers.add(num);
                        }
                    }
                }
            }
        }
        
        return !hasErrors;
    }

    function checkSolution() {
        if (!validateBoard()) {
            alert('There are errors in your solution. Please fix them before checking.');
            return;
        }
        
        // Check if all cells are filled
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (sudokuGrid[i][j] === 0) {
                    alert('Please fill all cells before checking the solution.');
                    return;
                }
            }
        }
        
        // Check if the solution matches the generated solution
        let isCorrect = true;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (sudokuGrid[i][j] !== solutionGrid[i][j]) {
                    isCorrect = false;
                    getCellElement(i, j).classList.add('error');
                }
            }
        }
        
        if (isCorrect) {
            stopTimer();
            puzzlesSolved++;
            saveStats();
            completionTimeDisplay.textContent = `Time: ${formatTime(seconds)}`;
            successModal.style.display = 'flex';
        } else {
            alert('There are mistakes in your solution. Incorrect cells are highlighted.');
        }
    }

    function showResetModal() {
        resetModal.style.display = 'flex';
    }

    function hideResetModal() {
        resetModal.style.display = 'none';
    }

    function resetPuzzle() {
        hideResetModal();
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (!fixedCells[i][j]) {
                    sudokuGrid[i][j] = 0;
                }
            }
        }
        
        renderBoard();
        clearHighlights();
    }

    function giveHint() {
        if (!selectedCell) {
            alert('Please select a cell first by clicking on it.');
            return;
        }
        
        const [row, col] = selectedCell;
        if (fixedCells[row][col]) {
            alert('This cell is already filled as part of the puzzle.');
            return;
        }
        
        sudokuGrid[row][col] = solutionGrid[row][col];
        renderBoard();
        
        // Highlight the hinted cell
        getCellElement(row, col).classList.add('highlight');
    }

    function toggleDifficulty() {
        switch(difficulty) {
            case 'easy':
                difficulty = 'medium';
                difficultyBtn.textContent = 'Difficulty: Medium';
                break;
            case 'medium':
                difficulty = 'hard';
                difficultyBtn.textContent = 'Difficulty: Hard';
                break;
            case 'hard':
                difficulty = 'easy';
                difficultyBtn.textContent = 'Difficulty: Easy';
                break;
        }
    }

    function startTimer() {
        stopTimer();
        timer = setInterval(() => {
            seconds++;
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = formatTime(seconds);
    }

    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function loadStats() {
        puzzlesSolved = parseInt(localStorage.getItem('puzzlesSolved')) || 0;
        puzzlesSolvedDisplay.textContent = `Puzzles Solved: ${puzzlesSolved}`;
    }

    function saveStats() {
        localStorage.setItem('puzzlesSolved', puzzlesSolved.toString());
        puzzlesSolvedDisplay.textContent = `Puzzles Solved: ${puzzlesSolved}`;
    }
});