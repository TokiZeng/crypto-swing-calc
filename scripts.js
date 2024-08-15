document.addEventListener('DOMContentLoaded', function() {
    const cryptoSymbolInput = document.getElementById('cryptoSymbol');
    const cryptoSelect = document.getElementById('cryptoSelect');
    const currentPriceInput = document.getElementById('currentPrice');
    const transactionContainer = document.getElementById('transactionContainer');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const calculateBtn = document.getElementById('calculateBtn');
    const feeRateInput = document.getElementById('feeRate');
    const profitDisplay = document.getElementById('profit');
    const totalCostDisplay = document.getElementById('totalCost');
    const totalFeeDisplay = document.getElementById('totalFee');
    const individualProfitsList = document.getElementById('individualProfits');
    const calculationTypeSelect = document.getElementById('calculationType');
    const initialAmountTypeSelect = document.getElementById('initialAmountType');
    const initialAmountInput = document.getElementById('initialAmount');
    const initialAmountLabel = document.querySelector('label[for="initialAmount"]');
    const totalAssetDisplay = document.getElementById('totalAsset');

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
        let totalCost = parseFloat(initialAmountInput.value); // 成本為起始數量
        let totalFee = 0;
        let currentQuantity;
        let initialAmount = totalCost;

        const feeRate = parseFloat(feeRateInput.value) / 100;
        individualProfitsList.innerHTML = ''; // 清空先前的計算結果

        const transactionEntries = document.querySelectorAll('.transaction-entry');
        transactionEntries.forEach((entry, index) => {
            const buyPrice = parseFloat(entry.querySelector('.buyPrice').value);
            const sellPrice = parseFloat(entry.querySelector('.sellPrice').value);

            currentQuantity = initialAmount / buyPrice; // 買入的 BTC 數量
            const buyCost = initialAmount;
            const sellRevenue = sellPrice * currentQuantity;
            const feeAmount = (buyCost * feeRate) + (sellRevenue * feeRate);
            let profit = sellRevenue - buyCost - feeAmount;

            totalFee += feeAmount;
            totalProfit += profit;

            // 更新下一次交易的初始資金
            initialAmount = sellRevenue;

            // 顯示每次交易的交易金額、利潤和手續費
            const profitItem = document.createElement('li');
            profitItem.innerHTML = `第${index + 1}次交易 -<br>
                                    交易金額：${buyCost.toFixed(2)} USDT<br>
                                    利潤：${profit.toFixed(2)} USDT<br>
                                    手續費：${feeAmount.toFixed(2)} USDT`;
            individualProfitsList.appendChild(profitItem);
        });

        const totalAsset = totalCost - totalFee + totalProfit;

        totalCostDisplay.textContent = totalCost.toFixed(2) + ' USDT';
        totalFeeDisplay.textContent = totalFee.toFixed(2) + ' USDT';
        profitDisplay.textContent = totalProfit.toFixed(2) + ' USDT';
        totalAssetDisplay.textContent = totalAsset.toFixed(2) + ' USDT'; // 確保將結果顯示到頁面上
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
