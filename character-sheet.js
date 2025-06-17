// character-sheet.js

/**
 * Creates a form field element based on field configuration
 * @param {Object} field - Field configuration from JSON
 * @returns {HTMLElement} - The created field element
 */
function createField(field) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'field';

    const label = document.createElement('label');
    label.textContent = field.label;
    if (field.required) {
        label.innerHTML += ' <span class="required">*</span>';
    }
    fieldDiv.appendChild(label);

    let input;
    switch (field.type) {
        case 'text':
        case 'number':
            input = document.createElement('input');
            input.type = field.type;
            input.value = field.value || '';
            if (field.placeholder) {
                input.placeholder = field.placeholder;
            }
            break;
        case 'checkbox':
            input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = field.value || false;
            break;
        case 'textarea':
            input = document.createElement('textarea');
            input.value = field.value || '';
            if (field.placeholder) {
                input.placeholder = field.placeholder;
            }
            break;
        default:
            input = document.createElement('input');
            input.type = 'text';
            input.value = field.value || '';
    }

    if (field.required) {
        input.required = true;
    }

    // Add name attribute for form data collection
    input.name = field.label.toLowerCase().replace(/\s+/g, '_');
    
    // Apply current edit mode state to new fields
    const isEditable = isEditModeEnabled();
    if (!isEditable) {
        if (input.type === 'checkbox') {
            input.disabled = true;
        } else {
            input.readOnly = true;
        }
        input.classList.add('readonly');
    }
    
    fieldDiv.appendChild(input);
    return fieldDiv;
}

/**
 * Creates a group element containing multiple fields
 * @param {Object} group - Group configuration from JSON
 * @returns {HTMLElement} - The created group element
 */
function createGroup(group) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group';

    const title = document.createElement('div');
    title.className = 'group-title';
    title.textContent = group.name;
    groupDiv.appendChild(title);

    group.fields.forEach(field => {
        const fieldElement = createField(field);
        groupDiv.appendChild(fieldElement);
    });

    return groupDiv;
}

/**
 * Creates a row element containing multiple groups
 * @param {Object} row - Row configuration from JSON
 * @returns {HTMLElement} - The created row element
 */
function createRow(row) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    rowDiv.id = row.id;

    row.groups.forEach(group => {
        const groupElement = createGroup(group);
        rowDiv.appendChild(groupElement);
    });

    return rowDiv;
}

/**
 * Renders the character sheet from JSON data
 * @param {Object} data - The complete character sheet configuration
 */
function renderCharacterSheet(data) {
    const container = document.getElementById('character-sheet');
    container.innerHTML = ''; // Clear existing content
    
    data.rows.forEach(row => {
        const rowElement = createRow(row);
        container.appendChild(rowElement);
    });
}

/**
 * Displays an error message to the user
 * @param {string} message - Error message to display
 */
function showError(message) {
    const container = document.getElementById('character-sheet');
    container.innerHTML = `<div class="error">Error: ${message}</div>`;
}

/**
 * Loads character sheet from JSON file
 */
async function loadCharacterSheet() {
    try {
        // Show loading message
        const container = document.getElementById('character-sheet');
        container.innerHTML = '<div>Loading character sheet...</div>';
        
        // Fetch the JSON file from root folder
        const response = await fetch('./character-sheet-layout.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        renderCharacterSheet(data);
        
    } catch (error) {
        console.error('Error loading character sheet:', error);
        showError(`Failed to load character sheet: ${error.message}`);
    }
}

/**
 * Gets all form data as an object
 * @returns {Object} - Form data with field names as keys
 */
function getFormData() {
    const formData = {};
    const container = document.getElementById('character-sheet');
    const inputs = container.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            formData[input.name] = input.checked;
        } else {
            formData[input.name] = input.value;
        }
    });
    
    return formData;
}

/**
 * Saves form data (example function)
 */
function saveCharacterSheet() {
    const data = getFormData();
    console.log('Character sheet data:', data);
    // You could send this to a server or save to localStorage
    // localStorage.setItem('characterSheet', JSON.stringify(data));
}

/**
 * Toggles edit mode for all form fields
 */
function toggleEditMode() {
    const editToggle = document.getElementById('edit-toggle');
    const isEditable = editToggle.checked;
    const container = document.getElementById('character-sheet');
    const inputs = container.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
        // Skip the edit toggle itself
        if (input.id === 'edit-toggle') return;
        
        if (isEditable) {
            input.removeAttribute('readonly');
            input.removeAttribute('disabled');
            input.classList.remove('readonly');
        } else {
            if (input.type === 'checkbox') {
                input.disabled = true;
            } else {
                input.readOnly = true;
            }
            input.classList.add('readonly');
        }
    });
    
    // Update toggle label text
    const toggleLabel = document.querySelector('.toggle-label');
    toggleLabel.textContent = isEditable ? 'Enable Editing' : 'Enable Editing';
}

/**
 * Gets the current edit mode state
 * @returns {boolean} - True if editing is enabled
 */
function isEditModeEnabled() {
    const editToggle = document.getElementById('edit-toggle');
    return editToggle.checked;
}

// Auto-load character sheet when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadCharacterSheet();
});