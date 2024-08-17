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
    let transactionCount = 1;

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
        transactionCount++;
        bindRemoveButtons();
    });

    function bindRemoveButtons() {
        const removeButtons = document.querySelectorAll('.removeTransactionBtn');
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                button.parentElement.remove();
                updateTransactionLabels();
            });
        });
    }

    function updateTransactionLabels() {
        const transactionEntries = document.querySelectorAll('.transaction-entry');
        transactionCount = 1;
        transactionEntries.forEach(entry => {
            const labels = entry.querySelectorAll('label');
            labels[0].textContent = `第${transactionCount}次交易 - 買入價格：`;
            transactionCount++;
        });
        if (transactionEntries.length === 0) {
            transactionCount = 1;
        }
    }

    bindRemoveButtons();

    calculateBtn.addEventListener('click', function() {
        let totalProfit = 0;
        let totalCost = parseFloat(initialAmountInput.value);
        let totalFee = 0;
        let currentQuantity;
        let initialAmount = totalCost;

        const feeRate = parseFloat(feeRateInput.value) / 100;
        individualProfitsList.innerHTML = '';

        const transactionEntries = document.querySelectorAll('.transaction-entry');
        transactionEntries.forEach((entry, index) => {
            const buyPrice = parseFloat(entry.querySelector('.buyPrice').value);
            const sellPrice = parseFloat(entry.querySelector('.sellPrice').value);

            const buyFee = initialAmount * feeRate;
            const netBuyAmount = initialAmount - buyFee;
            currentQuantity = netBuyAmount / buyPrice;

            const grossSellAmount = currentQuantity * sellPrice;
            const sellFee = grossSellAmount * feeRate;
            const netSellAmount = grossSellAmount - sellFee;

            let profit = netSellAmount - initialAmount;
            totalFee += buyFee + sellFee;
            totalProfit += profit;

            initialAmount = netSellAmount;

            const profitItemClass = (index % 2 === 0) ? 'text-red-border' : 'text-green-border';

            const profitItem = document.createElement('li');
            profitItem.innerHTML = `<span class="${profitItemClass}">第${index + 1}次交易 -</span><br>
                                    <span class="${profitItemClass}">交易金額：${netBuyAmount.toFixed(2)} USDT</span><br>
                                    <span class="${profitItemClass}">利潤：${profit.toFixed(2)} USDT</span><br>
                                    <span class="${profitItemClass}">手續費: 買入[${buyFee.toFixed(2)}] 賣出[${sellFee.toFixed(2)}]</span>`;
            individualProfitsList.appendChild(profitItem);
        });

        const totalAsset = totalCost - totalFee + totalProfit;

        totalCostDisplay.textContent = totalCost.toFixed(2) + ' USDT';
        totalFeeDisplay.textContent = totalFee.toFixed(2) + ' USDT';
        profitDisplay.textContent = totalProfit.toFixed(2) + ' USDT';
        totalAssetDisplay.textContent = totalAsset.toFixed(2) + ' USDT';
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

    updateInitialAmountLabel();
});
