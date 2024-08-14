document.addEventListener('DOMContentLoaded', function() {
    const cryptoSymbolInput = document.getElementById('cryptoSymbol');
    const cryptoSelect = document.getElementById('cryptoSelect');
    const currentPriceInput = document.getElementById('currentPrice');
    const transactionContainer = document.getElementById('transactionContainer');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const calculateBtn = document.getElementById('calculateBtn');
    const feeRateInput = document.getElementById('feeRate');
    const profitDisplay = document.getElementById('profit');
    const calculationTypeSelect = document.getElementById('calculationType');
    const initialAmountTypeSelect = document.getElementById('initialAmountType');
    const initialAmountInput = document.getElementById('initialAmount');
    const initialAmountLabel = document.querySelector('label[for="initialAmount"]');

    let currentPrice = 0;
    let selectedSymbol = 'BTC/USDT';
    let transactionCount = 1; // 初始化交易計數

    const defaultSymbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'TON/USDT'];

    updateSymbolSelect(defaultSymbols.map(symbol => ({symbol: symbol.replace('/', '')})));

    cryptoSymbolInput.addEventListener('input', function() {
        const query = cryptoSymbolInput.value.toUpperCase();
        if (query.length > 0) {
            fetch(`https://api.binance.com/api/v3/ticker/price`)
                .then(response => response.json())
                .then(data => {
                    const symbolList = data.filter(item =>
                        item.symbol.endsWith('USDT') && item.symbol.startsWith(query)
                    );
                    updateSymbolSelect(symbolList);
                })
                .catch(error => console.error('Error fetching data:', error));
        } else {
            updateSymbolSelect(defaultSymbols.map(symbol => ({symbol: symbol.replace('/', '')})));
        }
    });

    cryptoSelect.addEventListener('change', function() {
        selectedSymbol = cryptoSelect.value;
        const apiSymbol = selectedSymbol.replace('/', '');
        fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${apiSymbol}`)
            .then(response => response.json())
            .then(data => {
                currentPrice = parseFloat(data.price);
                currentPriceInput.value = currentPrice.toFixed(2);
                updateInitialAmountLabel();
            })
            .catch(error => console.error('Error fetching data:', error));
    });

    initialAmountTypeSelect.addEventListener('change', function() {
        updateInitialAmountLabel();
    });

    function updateInitialAmountLabel() {
        const amountType = initialAmountTypeSelect.value;
        const baseSymbol = selectedSymbol.split('/')[0];
        if (amountType === 'crypto') {
            initialAmountLabel.textContent = `起始${baseSymbol}數量`;
        } else {
            initialAmountLabel.textContent = '起始USDT數量';
        }
    }

    fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${selectedSymbol.replace('/', '')}`)
        .then(response => response.json())
        .then(data => {
            currentPrice = parseFloat(data.price);
            currentPriceInput.value = currentPrice.toFixed(2);
        })
        .catch(error => console.error('Error fetching data:', error));

    addTransactionBtn.addEventListener('click', function() {
        const transactionEntry = document.createElement('div');
        transactionEntry.className = 'transaction-entry';
        transactionEntry.innerHTML = `
            <label>第${transactionCount}次交易 - 買入價格：</label>
            <input type="number" class="buyPrice" placeholder="輸入買入價格">
            <label>賣出價格：</label>
            <input type="number" class="sellPrice" placeholder="輸入賣出價格">
            <button class="removeTransactionBtn">移除</button>
        `;
        transactionContainer.appendChild(transactionEntry);
        transactionCount++; // 新增交易後計數器增加
        bindRemoveButtons(); // 重新綁定移除按鈕
    });

    function bindRemoveButtons() {
        const removeButtons = document.querySelectorAll('.removeTransactionBtn');
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                button.parentElement.remove();
                updateTransactionLabels(); // 更新剩餘交易的標籤
            });
        });
    }

    function updateTransactionLabels() {
        const transactionEntries = document.querySelectorAll('.transaction-entry');
        transactionCount = 1; // 重置計數器
        transactionEntries.forEach(entry => {
            const labels = entry.querySelectorAll('label');
            labels[0].textContent = `第${transactionCount}次交易 - 買入價格：`;
            transactionCount++;
        });
        if (transactionEntries.length === 0) {
            transactionCount = 1; // 如果沒有交易，將計數器重置為1
        }
    }

    bindRemoveButtons(); // 綁定現有的移除按鈕

    calculateBtn.addEventListener('click', function() {
        let totalProfit = 0;
        let currentQuantity;

        const feeRate = parseFloat(feeRateInput.value) / 100;
        const calculationType = calculationTypeSelect.value;
        const initialAmountType = initialAmountTypeSelect.value;
        const initialAmount = parseFloat(initialAmountInput.value);

        if (initialAmountType === 'usdt') {
            currentQuantity = initialAmount / currentPrice;
        } else {
            currentQuantity = initialAmount;
        }

        const transactionEntries = document.querySelectorAll('.transaction-entry');
        transactionEntries.forEach(entry => {
            const buyPrice = parseFloat(entry.querySelector('.buyPrice').value);
            const sellPrice = parseFloat(entry.querySelector('.sellPrice').value);
            const quantity = currentQuantity;

            const buyCost = buyPrice * quantity * (1 + feeRate);
            const sellRevenue = sellPrice * quantity * (1 - feeRate);
            let profit = sellRevenue - buyCost;

            if (calculationType === 'crypto') {
                profit = profit / currentPrice;
            }

            totalProfit += profit;
            currentQuantity = sellRevenue / sellPrice; // 更新持有數量
        });

        if (calculationType === 'crypto') {
            profitDisplay.textContent = totalProfit.toFixed(6) + ` ${selectedSymbol.split('/')[0]}`;
        } else {
            profitDisplay.textContent = totalProfit.toFixed(2) + ' USDT';
        }
    });

    function updateSymbolSelect(symbolList) {
        cryptoSelect.innerHTML = '';
        symbolList.forEach(symbol => {
            const formattedSymbol = symbol.symbol.replace('USDT', '/USDT');
            const option = document.createElement('option');
            option.value = formattedSymbol;
            option.textContent = formattedSymbol;
            cryptoSelect.appendChild(option);
        });

        if (symbolList.length > 0) {
            cryptoSelect.value = symbolList[0].symbol.replace('USDT', '/USDT');
            const event = new Event('change');
            cryptoSelect.dispatchEvent(event);
        }
    }

    // 初始化標籤
    updateInitialAmountLabel();
});
