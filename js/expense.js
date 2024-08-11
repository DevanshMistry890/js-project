$(document).ready(function () {
    const expenseForm = $('#expense-form');
    const expenseTableBody = $('#expense-table tbody');
    const totalExpenseElement = $('#total-expense');
    const categorySelect = $('#category');
    const expenseChart = $('#expense-chart');
    const filterBtn = $('#filter-btn');
    const clearFilterBtn = $('#clear-filter-btn');
    let totalExpenses = 0;
    let expenses = [];
    let filteredExpenses = [];
    let chartInstance = null;

    // Initialize categories
    const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Other'];
    categories.forEach(category => {
        categorySelect.append(new Option(category, category));
    });

    // Load expenses from localStorage
    loadExpenses();

    expenseForm.on('submit', function (event) {
        event.preventDefault();

        const description = $('#description').val();
        const amount = parseFloat($('#amount').val());
        const category = $('#category').val();
        const date = $('#date').val();
        const tags = $('#tags').val().split(',').map(tag => tag.trim());

        if (description && amount && category && date) {
            addExpense(description, amount, category, date, tags);
            expenseForm.trigger('reset');
        }
    });

    function addExpense(description, amount, category, date, tags) {
        const expense = { description, amount, category, date, tags };
        expenses.push(expense);
        filteredExpenses = expenses.slice(); // Update filteredExpenses to match expenses
        saveExpenses();

        renderExpenseRow(expense, expenses.length - 1);

        totalExpenses += amount;
        updateTotalExpense();
        updateChart();
    }

    function removeExpense(index) {
        totalExpenses -= expenses[index].amount;
        expenses.splice(index, 1);
        filteredExpenses = expenses.slice(); // Update filteredExpenses to match expenses
        saveExpenses();

        updateTotalExpense();
        updateChart();
        renderExpenses();
    }

    function updateTotalExpense() {
        totalExpenseElement.text(`Total Expenses: $${totalExpenses.toFixed(2)}`);
    }

    function updateChart() {
        const categoryTotals = {};
        filteredExpenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });

        const ctx = expenseChart[0].getContext('2d');

        // Destroy existing chart if it exists
        if (chartInstance) {
            chartInstance.destroy();
        }

        // Create new chart
        chartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                }]
            },
            options: {
                responsive: true, // Make the chart responsive
                maintainAspectRatio: false, // Allow the chart to adjust its aspect ratio
                plugins: {
                    legend: {
                        display: true, // Display the legend
                        position: 'top' // Position the legend at the top
                    },
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                // Format the tooltip label to include percentage
                                const label = tooltipItem.label || '';
                                const value = tooltipItem.raw || 0;
                                const total = tooltipItem.dataset.data.reduce((acc, val) => acc + val, 0);
                                const percentage = ((value / total) * 100).toFixed(2);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Adjust chart size to fit container
        expenseChart.css({ width: '100%', height: '300px' }); // Example size, adjust as needed
    }

    function saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }

    function loadExpenses() {
        const storedExpenses = localStorage.getItem('expenses');
        if (storedExpenses) {
            expenses = JSON.parse(storedExpenses);
            filteredExpenses = expenses.slice(); // Initialize filteredExpenses
            renderExpenses(); // Render expenses to the table
    
            // Calculate the total expenses from the loaded data
            totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            updateTotalExpense(); // Update total expenses
    
            updateChart(); // Update the chart with loaded expenses
        } else {
            updateChart(); // Ensure the chart is initialized even if no expenses are present
        }
    }

    function renderExpenses() {
        expenseTableBody.empty();
        filteredExpenses.forEach((exp, index) => {
            renderExpenseRow(exp, index);
        });
    }

    function renderExpenseRow(exp, index) {
        const row = `
            <tr>
                <td>${exp.description}</td>
                <td>$${exp.amount.toFixed(2)}</td>
                <td>${exp.category}</td>
                <td>${exp.date}</td>
                <td>${exp.tags.join(', ')}</td>
                <td><button class="remove-expense" data-index="${index}">Remove</button></td>
            </tr>
        `;
        expenseTableBody.append(row);
    }

    $('#expense-table').on('click', '.remove-expense', function () {
        const index = $(this).data('index');
        removeExpense(index);
    });

    filterBtn.on('click', function () {
        const descriptionFilter = $('#filter-description').val().toLowerCase();
        const dateFrom = $('#filter-date-from').val();
        const dateTo = $('#filter-date-to').val();

        filteredExpenses = expenses.filter(exp => {
            const matchesDescription = exp.description.toLowerCase().includes(descriptionFilter);
            const matchesDate = (!dateFrom || new Date(exp.date) >= new Date(dateFrom)) &&
                (!dateTo || new Date(exp.date) <= new Date(dateTo));
            return matchesDescription && matchesDate;
        });

        totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0); // Update total expenses based on filtered results
        updateTotalExpense();
        updateChart();
        renderExpenses();
    });

    clearFilterBtn.on('click', function () {
        // Clear filter inputs
        $('#filter-description').val('');
        $('#filter-date-from').val('');
        $('#filter-date-to').val('');
    
        // Clear expenses array
        expenses = [];
        
        // Update filtered expenses to an empty array
        filteredExpenses = [];
    
        // Reset total expenses
        totalExpenses = 0;
    
        // Update the displayed total expense
        updateTotalExpense();
    
        // Clear the expenses table
        expenseTableBody.empty();
    
        // Clear the chart
        if (chartInstance) {
            chartInstance.destroy();
            expenseChart.attr('width', '0').attr('height', '0'); // Resize chart to 0x0
        }
    
        // Clear expenses from localStorage
        localStorage.removeItem('expenses');
    });        
});
