document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const titleInput = document.getElementById('title');
    const titleFontSizeInput = document.getElementById('title-font-size');
    const conditionSelect = document.getElementById('condition');
    const notesTextarea = document.getElementById('notes');
    const notesFontSizeInput = document.getElementById('notes-font-size');
    const priceInput = document.getElementById('price');
    const printButton = document.getElementById('print-button');

    const previewTitle = document.getElementById('preview-title');
    const previewCondition = document.getElementById('preview-condition');
    const previewNotes = document.getElementById('preview-notes');
    const previewPrice = document.getElementById('preview-price');
    const barcodeSvg = document.getElementById('barcode');
    const timestampDiv = document.getElementById('timestamp');
    const priceCardDiv = document.getElementById('price-card'); // 金額リサイズ用
    const priceRowDiv = document.querySelector('.price-row'); // 金額リサイズ用

    // --- EAN-13 チェックデジット計算関数 ---
    function calculateEan13CheckDigit(digits) {
        if (digits.length !== 12) {
            console.error("Check digit calculation requires 12 digits.");
            return null;
        }
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(digits[i], 10);
            sum += (i % 2 === 0) ? digit : digit * 3;
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit.toString();
    }

    // --- バーコード生成関数 ---
    function generateBarcode() {
        const price = parseInt(priceInput.value, 10) || 0;
        const condition = conditionSelect.value;
        let baseNumberStr = 0;

        if (condition === '中古') {
            baseNumberStr = 207880000000; 
        } else { // 未使用
            baseNumberStr = 270750000000;
        }

        // BigInt を使って大きな数値を扱う
        try {
            const baseNumber = BigInt(baseNumberStr);
            const priceBigInt = BigInt(price);
            const totalNumber = baseNumber + priceBigInt;

            // 12桁に整形 (先頭ゼロ埋め)
            let barcodeDigits = totalNumber.toString().slice(-12).padStart(12, '0');

            // チェックデジット計算
            const checkDigit = calculateEan13CheckDigit(barcodeDigits);

            if (checkDigit !== null) {
                const finalBarcodeValue = barcodeDigits + checkDigit;

                // JsBarcodeで生成
                JsBarcode(barcodeSvg, finalBarcodeValue, {
                    format: "EAN13",
                    width: 1, // ★ バーの幅を1に設定 (デフォルトは2)
                    height: 25, // デフォルトの半分 (デフォルトは50?)
                    displayValue: true, // 数値を表示
                    fontSize: 12, // 数値のフォントサイズ
                    margin: 5,// バーコード周りの余白
                    background: "transparent",// ★ 背景を透明に設定
                    textPosition: "bottom",
                    textMargin: 2,
                    font: "Arial"
                });
                barcodeSvg.style.display = 'block'; // 表示する
            } else {
                 console.error("Failed to calculate check digit.");
                 barcodeSvg.style.display = 'none'; // エラー時は非表示
            }

        } catch (e) {
            console.error("Barcode generation error:", e);
            // エラー発生時はバーコードを非表示にするか、エラー表示を出す
            barcodeSvg.style.display = 'none';
        }
    }

    // --- 金額のフォントサイズ調整関数 ---
    function adjustPriceFontSize() {
        const containerWidth = priceRowDiv.clientWidth - 10; // 左右のpadding分を考慮
        let fontSize = 85; // 開始フォントサイズ (大きめから始める)
        previewPrice.style.fontSize = fontSize + 'px';

        // 要素の幅がコンテナ幅を超える限りフォントサイズを小さくする
        /*while (previewPrice.scrollWidth > containerWidth && fontSize > 10) {
            fontSize -= 1;
            previewPrice.style.fontSize = fontSize + 'px';
       } */
    }

    // --- タイムスタンプ更新関数 ---
    function updateTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        timestampDiv.textContent = `作成日時: ${year}/${month}/${day} ${hours}:${minutes}`;
    }

    // --- プレビュー更新関数 ---
    function updatePreview() {
        // タイトル
        previewTitle.textContent = titleInput.value || '商品タイトル';
        previewTitle.style.fontSize = titleFontSizeInput.value + 'px';

        // 状態
        const selectedOption = conditionSelect.options[conditionSelect.selectedIndex];
        previewCondition.textContent = selectedOption.text;

        // 備考
        previewNotes.textContent = notesTextarea.value || '';
        previewNotes.style.fontSize = notesFontSizeInput.value + 'px';

        // 金額
        const priceValue = parseInt(priceInput.value, 10);
        if (!isNaN(priceValue)) {
            previewPrice.textContent = `¥${priceValue.toLocaleString()}`; // 3桁区切り
        } else {
            previewPrice.textContent = '¥---';
        }

        // 金額フォントサイズ調整
        adjustPriceFontSize();

        // バーコード生成
        generateBarcode();

        // タイムスタンプ更新 (毎回更新しても良いし、初回と印刷時だけでも良い)
        updateTimestamp();
    }

    // --- イベントリスナーの設定 ---
    titleInput.addEventListener('input', updatePreview);
    titleFontSizeInput.addEventListener('input', updatePreview);
    conditionSelect.addEventListener('change', updatePreview);
    notesTextarea.addEventListener('input', updatePreview);
    notesFontSizeInput.addEventListener('input', updatePreview);
    priceInput.addEventListener('input', updatePreview);
    const reloadButton = document.getElementById('reload-button');
    // ★ リセット（リロード）ボタンのクリックイベント
    reloadButton.addEventListener('click', () => {
        // ページ全体をリロードする
        location.reload();
    });

    // 印刷ボタン
    printButton.addEventListener('click', () => {
        // 印刷前に最新の状態を反映 (念のため)
        updatePreview();
        // 少し待ってから印刷ダイアログを開く (スタイル適用や描画のため)
        setTimeout(() => {
            window.print();
        }, 100);
    });

    // --- 初期表示 ---
    updatePreview();

    // ウィンドウリサイズ時にも金額フォントサイズを再調整
    window.addEventListener('resize', adjustPriceFontSize);
});
