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
    const initialQuantityInput = document.getElementById('initialQuantity');

    let currentPrice = 0;
    let selectedSymbol = 'BTC/USDT';

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
            })
            .catch(error => console.error('Error fetching data:', error));
    });

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
            <label>買入價格：</label>
            <input type="number" class="buyPrice" placeholder="輸入買入價格">
            <label>賣出價格：</label>
            <input type="number" class="sellPrice" placeholder="輸入賣出價格">
        `;
        transactionContainer.appendChild(transactionEntry);
    });

    calculateBtn.addEventListener('click', function() {
        let totalProfit = 0;
        let currentQuantity = parseFloat(initialQuantityInput.value); // 初始買入數量
        const feeRate = parseFloat(feeRateInput.value) / 100;
        const calculationType = calculationTypeSelect.value;

        const transactionEntries = document.querySelectorAll('.transaction-entry');
        transactionEntries.forEach(entry => {
            const buyPrice = parseFloat(entry.querySelector('.buyPrice').value);
            const sellPrice = parseFloat(entry.querySelector('.sellPrice').value);
            const quantity = currentQuantity; // 使用當前的持有數量

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

        // 自動選擇第一個選項並觸發價格更新
        if (symbolList.length > 0) {
            cryptoSelect.value = symbolList[0].symbol.replace('USDT', '/USDT');
            const event = new Event('change');
            cryptoSelect.dispatchEvent(event);
        }
    }
});
