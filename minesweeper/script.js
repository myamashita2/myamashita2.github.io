/*定数定義*/
const bombMin = 5;
const tableMin = 8;
const tableMax = 20;

/*タイマーの設定*/
let nowTime = 0;
let timeSec = document.getElementById('time-sec');

/*コマ数情報、爆弾数情報、閉じているテーブルのコマ、爆弾の配置情報*/
let tableNum;
let bombNum;
let bombMax;
let allCellNum;
let bombCount;
let tableInfo = [];
let isFlagMode = false;
let isQuestionMode = false;


/*リスタートボタン、テーブル（ボード）、爆弾の情報を取得*/
let restartBtn = document.getElementById('restart');
let board = document.getElementById('board');
let bombArea = document.getElementById('bomb');
let timerArea = document.getElementById('timer-area');
let flagMode = document.getElementById('flag-mode');
let questionMode = document.getElementById('question-mode');
let bombCountNom = document.getElementById('bomb-count-nom');

/*リスタートボタン*/
restartBtn.addEventListener('click', getNum, false);
restartBtn.addEventListener('click', createTable, false);


/*コマ数情報、爆弾数情報を取得するfunction*/
function getNum() {
    let mode = document.getElementById('mode').value.split(',');
    bombNum = Number(mode[0]);
    tableNum = Number(mode[1]);
    allCellNum = tableNum*tableNum
}

function createTable() {
    /*テーブルリセット*/
    while (board.rows.length > 0) {
        board.deleteRow(0);
    }
    bombCountNom.textContent = '0';
    bombCount = 0;
    tableMargin(tableNum);
    timerStop();//タイマーストップ
    timerReset(); //タイマーリセット
    /*テーブルセット*/
    for (let i = 0; i < tableNum; i++) {
        let row = document.createElement('tr');
        row.setAttribute('id', 'row' + i);
        for (let j = 0; j < tableNum; j++) {
            let td = document.createElement('td');
            let btn = document.createElement('button');
            btn.classList.add('borderBtn');
            btn.setAttribute('name', i + ',' + j);
            td.appendChild(btn);
            td.setAttribute('id', i + ',' + j);
            td.setAttribute('class', 'closed');
            row.appendChild(td);
        }
        board.appendChild(row);
    }
}

/*タイマー起動**/
function timerSet() {
    nowTime = setInterval(() => {
        let num = Number(timeSec.textContent);
        num++;
        if (num < 10) {
            time = '000' + num;
        }else if (num <100){
            time = '00' + num;
        }else if(num <1000){
            time = '0' + num;
        }
        timeSec.textContent = time;
    }, 1000);
}

/*タイマーリセット*/
function timerReset() {
    timeSec.textContent = '0000';
}

function timerStop() {
    clearInterval(nowTime);
}


/*セルをに対する操作をする（セルオープン、セルにフラッグをつける。セルにクエスチョンをつける*/
board.addEventListener('click', function (e) {
    if (e.target.tagName === 'BUTTON') {
        let clickedId = e.target.name;
        let clickedBtn = document.getElementsByName(clickedId);
        /*フラグモードかクエスチョンモードを判別する*/
        /*フラグモードの場合*/
        if (isFlagMode) {
            clickedBtn.forEach(element => {
                if (element.classList.contains('flag')) { //すでにフラグがある場合は、フラグを消す。
                    element.classList.remove('flag');
                    bombCount -= 1;
                } else {//クエスチョンを消して、フラグにする。
                    element.classList.remove('question');
                    element.classList.add('flag');
                    bombCount += 1;
                }
            })
            bombCountNom.textContent = bombCount;
            /*クエスチョンモードの場合*/
        } else if (isQuestionMode) {
            clickedBtn.forEach(element => {
                if (element.classList.contains('question')) {//すでにクエスチョンがある場合は、クエスチョンを消す。
                    element.classList.remove('question');
                } else {//フラグを消しては、クエスチョンにする。
                    element.classList.remove('flag');
                    element.classList.add('question');
                }
            })
        } else {
            /*ノーマルモードの場合*/
            let map = clickedId.split(',');
            /*初回クリックの場合は初回クリックで爆弾をセットする*/
            let nowOpenList = document.getElementsByClassName('open');
            if (nowOpenList.length == 0) {
                /*爆弾をセットするfunction*/
                setBomb(map);
                /*初回クリックでタイマーを起動*/
                timerSet();
            }
            let openList = [];
            if (tableInfo[map[0]][map[1]] === 9) { //爆弾をクリックしたら、ゲームオーバー
                window.alert("ゲームオーバー!");
                timerStop();
                let closedList = document.getElementsByClassName('closed');
                for (let i = 0; i < closedList.length; i++) {
                    openList.push(closedList[i].id);
                }
            } else {
                /*爆弾以外でゼロかそれ以外だったら、オープンするセルのリストを作る*/
                if (tableInfo[map[0]][map[1]] == 0) {
                    openList = bulkOpenList(clickedId);
                } else {
                    openList.push(clickedId);
                }
            }
            for (let index of openList) {//実際のセルオープン
                let box = document.getElementById(index);
                box.removeChild(box.firstChild);
                box.setAttribute('class', 'open');
                map = index.split(',');
                if (tableInfo[map[0]][map[1]] !== 0) {
                    if (tableInfo[map[0]][map[1]] === 9) {
                        box.textContent = String.fromCodePoint(0x1F4A3);//unicodeで爆弾を置く
                    } else {
                        box.textContent = tableInfo[map[0]][map[1]];
                    }
                }
            }
            if (endJudge()) {
                window.alert("クリア!");
                timerStop();
            }

        }
    }
}, false);



/*爆弾と数字をセットする*/
/*xが横向き、yが縦向き*/
function setBomb(map) {
    //爆弾数、コマ数セット
    tableInfo = Array.from({ length: tableNum }, () => Array(tableNum).fill(0)); //配列セット
    let firstClickedY = Number(map[0]);
    let firstClickedX = Number(map[1]);
    for (let i = 1; i <= bombNum; i++) {
        while (true) {
            let x = Math.floor(Math.random() * (tableNum));
            let y = Math.floor(Math.random() * (tableNum));
            if (tableInfo[y][x] === 9 || //すでに爆弾がおかれている場所には爆弾を置かない
                /*一番最初にクリックされた場所は、絶対に0にするため、
                周りにも爆弾を置かない*/
                (y >= firstClickedY - 1 && y <= firstClickedY + 1 && x >= firstClickedX - 1 && x <= firstClickedX + 1)
            ) {
                continue;
            }
            tableInfo[y][x] = 9; //最初に爆弾を置く
            for (let m = x - 1; m <= x + 1; m++) { //爆弾の周囲に数を置く
                if (m < 0 || m >= tableNum) continue; // インデックス範囲チェック
                for (let n = y - 1; n <= y + 1; n++) {
                    if (n < 0 || n >= tableNum) continue; // インデックス範囲チェック
                    if (tableInfo[n][m] !== 9) { // 爆弾が既に置かれている位置は除外
                        tableInfo[n][m] += 1;
                    }
                }
            }
            break;
        }
    }
}


function tableMargin(tableNum) {
    let tableMargin = 500;
    let minusMargin = (tableMin - tableNum) * (7 + tableNum);
    board.style.marginLeft = `${tableMargin + minusMargin}px`
}


/*0がクリックされた際のまとめて開く場所を検索する。*/
function bulkOpenList(clickedId) {
    /*初期化*/
    let zeroList = [];
    let openList = [];

    openList.push(clickedId);
    zeroList.push(clickedId);

    /*クリックしたマスを基準に開くマスのリストを作る。ゼロとゼロの周りをオープンする。
    zeroListはこのループの実行中に追加されるので、変化する。*/
    for (let zero of zeroList) {
        let index = zero.split(',');
        let y = Number(index[0]);
        let x = Number(index[1]);
        for (let m = x - 1; m <= x + 1; m++) {
            if (m < 0 || m >= tableNum) continue; // インデックス範囲チェック
            for (let n = y - 1; n <= y + 1; n++) {
                if (n < 0 || n >= tableNum) continue; // インデックス範囲チェック
                let map = n + ',' + m;
                if (!openList.includes(map)) {
                    openList.push(map);
                    if (tableInfo[n][m] == 0) {
                        zeroList.push(map);
                    }
                }
            }
        }
    }
    return openList;
}


//爆弾以外の終了の判定
function endJudge() {
    let nowOpenList = document.getElementsByClassName('open');
    let closedTableNum = allCellNum - nowOpenList.length;
    console.log(closedTableNum);
    console.log(bombNum);
    if (closedTableNum === bombNum) {
        return true;
    } else {
        return false;
    }
}

/*旗・クエスチョンモードチェンジ*/
timerArea.addEventListener('click', function (e) {
    if (e.target.tagName === 'BUTTON') {
        let clickedBtn = e.target.id;
        let mode = e.target.classList;
        if (clickedBtn == 'flag-mode') {
            if (mode == 'off') {
                flagMode.setAttribute('class', 'on');
                flagMode.textContent = 'on'
                isFlagMode = true;
                questionMode.setAttribute('class', 'off');
                questionMode.textContent = 'off'
                isQuestionMode = false;
            } else if (mode == 'on') {
                flagMode.setAttribute('class', 'off');
                flagMode.textContent = 'off'
                isFlagMode = false;
            }
        } else if (clickedBtn == 'question-mode') {
            if (mode == 'off') {
                flagMode.setAttribute('class', 'off');
                flagMode.textContent = 'off'
                isFlagMode = false;
                questionMode.setAttribute('class', 'on');
                questionMode.textContent = 'on'
                isQuestionMode = true;
            } else if (mode == 'on') {
                questionMode.setAttribute('class', 'off');
                questionMode.textContent = 'off'
                isQuestionMode = false;
            }
        }
    }
}, false);



