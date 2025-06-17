// Main data structure
let formStructure = {
  rows: [],
  groups: {},
  fields: {},
  editable: true // Global edit state
};

class FormRow {
  constructor() {
    this.id = 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    this.element = document.createElement('div');
    this.element.className = 'form-row';
    this.element.dataset.rowId = this.id;
    this.element.style.display = 'flex';
    this.element.style.gap = '20px';
    this.element.style.marginBottom = '20px';
    this.element.style.padding = '10px';
    this.element.style.border = '1px solid #ddd';
    this.element.style.borderRadius = '5px';
  }

  toJSON() {
    return {
      id: this.id,
      type: 'row'
    };
  }
}

class FieldGroup {
  constructor(name, rowId) {
    this.name = name;
    this.rowId = rowId;
    this.element = document.createElement('div');
    this.element.className = 'field-group';
    this.element.style.flex = '1';
    this.element.style.minWidth = '200px';
    this.element.innerHTML = `<div class="group-header" style="font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">${name}</div>`;
    
    this.fieldsContainer = document.createElement('div');
    this.fieldsContainer.className = 'fields-container';
    this.fieldsContainer.style.display = 'flex';
    this.fieldsContainer.style.flexDirection = 'column';
    this.fieldsContainer.style.gap = '10px';
    this.element.appendChild(this.fieldsContainer);
  }

  toJSON() {
    return {
      name: this.name,
      rowId: this.rowId
    };
  }
}

class FormField {
  constructor(config) {
    this.id = config.id || 'field_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    this.label = config.label || '';
    this.type = config.type || 'text';
    this.required = config.required || false;
    this.value = config.value || this.getDefaultValue();
    this.group = config.group || 'default';
    
    this.element = this.createElement();
    this.updateEditState(formStructure.editable);
  }

  getDefaultValue() {
    switch(this.type) {
      case 'checkbox': return false;
      case 'number': return 0;
      default: return '';
    }
  }

  createElement() {
    const wrapper = document.createElement('div');
    wrapper.className = 'field-preview';
    wrapper.dataset.fieldId = this.id;
    
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
    
    const title = document.createElement('strong');
    title.textContent = `${this.label} (${this.type})${this.required ? ' *' : ''}`;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.cssText = 'background: #dc3545; padding: 5px 10px; font-size: 12px;';
    deleteBtn.onclick = () => this.delete();
    
    header.appendChild(title);
    header.appendChild(deleteBtn);
    
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = this.label;
    label.style.display = 'block';
    label.style.marginBottom = '5px';
    
    let input;
    switch(this.type) {
      case 'textarea':
        input = document.createElement('textarea');
        input.rows = 3;
        break;
      case 'checkbox':
        input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = this.value;
        break;
      default:
        input = document.createElement('input');
        input.type = this.type;
        input.value = this.value;
    }
    
    input.disabled = !formStructure.editable;
    input.required = this.required;
    input.style.width = '100%';
    input.style.padding = '8px';
    
    input.addEventListener('change', (e) => {
      this.value = this.type === 'checkbox' ? e.target.checked : e.target.value;
      updateJsonOutput();
    });
    
    if (this.type === 'checkbox') {
      const checkboxWrapper = document.createElement('div');
      checkboxWrapper.style.cssText = 'display: flex; align-items: center; gap: 8px;';
      checkboxWrapper.appendChild(input);
      checkboxWrapper.appendChild(label);
      fieldGroup.appendChild(checkboxWrapper);
    } else {
      fieldGroup.appendChild(label);
      fieldGroup.appendChild(input);
    }
    
    wrapper.appendChild(header);
    wrapper.appendChild(fieldGroup);
    
    return wrapper;
  }

  updateEditState(editable) {
    const input = this.element.querySelector('input, textarea');
    if (input) {
      input.disabled = !editable;
    }
  }

  delete() {
    // Remove from data structure
    const row = formStructure.rows.find(row => 
      row.fields.includes(this.id)
    );
    
    if (row) {
      row.fields = row.fields.filter(fieldId => fieldId !== this.id);
      delete formStructure.fields[this.id];
      
      // Remove from DOM
      this.element.remove();
      
      // Clean up empty group if needed
      const group = formStructure.groups[this.group];
      if (group && group.fieldsContainer.children.length === 0) {
        group.element.remove();
        delete formStructure.groups[this.group];
      }
      
      // Clean up empty row if needed
      if (row.fields.length === 0) {
        const rowElement = document.querySelector(`[data-row-id="${row.id}"]`);
        rowElement.remove();
        formStructure.rows = formStructure.rows.filter(r => r.id !== row.id);
      }
      
      updateJsonOutput();
    }
  }

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      required: this.required,
      value: this.value,
      group: this.group
    };
  }
}

// UI Functions
function addField() {
  const label = document.getElementById('field-label').value.trim();
  const type = document.getElementById('field-type').value;
  const required = document.getElementById('field-required').checked;
  const groupName = document.getElementById('field-group').value || 'default';
  const rowSelect = document.getElementById('field-row');
  const rowId = rowSelect.value || createNewRow();

  if (!label) {
    alert('Please fill in field label');
    return;
  }

  // Create field
  const field = new FormField({
    label: label,
    type: type,
    required: required,
    group: groupName
  });

  // Add to data structure
  formStructure.fields[field.id] = field;
  formStructure.rows.find(row => row.id === rowId).fields.push(field.id);
  
  if (!formStructure.groups[groupName]) {
    formStructure.groups[groupName] = new FieldGroup(groupName, rowId);
  }

  // Add to DOM
  const rowElement = document.querySelector(`[data-row-id="${rowId}"]`);
  const group = formStructure.groups[groupName];
  
  if (!rowElement.contains(group.element)) {
    rowElement.appendChild(group.element);
  }
  
  group.fieldsContainer.appendChild(field.element);

  // Clear form
  document.getElementById('field-label').value = '';
  document.getElementById('field-required').checked = false;
  
  updateJsonOutput();
  updateRowSelect();
}

function createNewRow() {
  const row = new FormRow();
  formStructure.rows.push({
    id: row.id,
    fields: []
  });
  
  document.getElementById('fields-container').appendChild(row.element);
  updateRowSelect();
  return row.id;
}

function updateRowSelect() {
  const rowSelect = document.getElementById('field-row');
  rowSelect.innerHTML = '<option value="">Create New Row</option>';
  
  formStructure.rows.forEach(row => {
    const option = document.createElement('option');
    option.value = row.id;
    option.textContent = `Row ${formStructure.rows.indexOf(row) + 1}`;
    rowSelect.appendChild(option);
  });
}

function toggleEditState() {
  const toggle = document.getElementById('edit-toggle');
  formStructure.editable = toggle.checked;
  
  // Update all fields
  Object.values(formStructure.fields).forEach(field => {
    field.updateEditState(formStructure.editable);
  });
  
  // Update button text
  document.querySelector('label[for="edit-toggle"]').textContent = 
    formStructure.editable ? 'Editing Enabled' : 'Editing Disabled';
}

function clearFields() {
  formStructure = {
    rows: [],
    groups: {},
    fields: {},
    editable: true
  };
  
  document.getElementById('fields-container').innerHTML = '<p>No fields added yet</p>';
  document.getElementById('edit-toggle').checked = true;
  toggleEditState();
  updateRowSelect();
  updateJsonOutput();
}

function updateJsonOutput() {
  const output = {
    rows: formStructure.rows.map(row => row.toJSON()),
    groups: Object.fromEntries(
      Object.entries(formStructure.groups).map(([name, group]) => [name, group.toJSON()])
    ),
    fields: Object.fromEntries(
      Object.entries(formStructure.fields).map(([id, field]) => [id, field.toJSON()])
    ),
    editable: formStructure.editable
  };
  
  document.getElementById('json-output').textContent = JSON.stringify(output, null, 2);
}

function saveToJson() {
  const dataStr = JSON.stringify({
    rows: formStructure.rows.map(row => row.toJSON()),
    groups: Object.fromEntries(
      Object.entries(formStructure.groups).map(([name, group]) => [name, group.toJSON()])
    ),
    fields: Object.fromEntries(
      Object.entries(formStructure.fields).map(([id, field]) => [id, field.toJSON()])
    ),
    editable: formStructure.editable
  }, null, 2);
  
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'form-fields.json';
  link.click();
  
  URL.revokeObjectURL(url);
}

function loadFromJson() {
  // Example JSON data
  const exampleJson = {
    rows: [
      {id: 'row1', type: 'row'},
      {id: 'row2', type: 'row'}
    ],
    groups: {
      personal: {name: 'Personal Info', rowId: 'row1'},
      contact: {name: 'Contact Info', rowId: 'row1'},
      settings: {name: 'Settings', rowId: 'row2'}
    },
    fields: {
      field1: {
        id: 'field1',
        label: 'First Name',
        type: 'text',
        required: true,
        value: '',
        group: 'personal'
      },
      field2: {
        id: 'field2',
        label: 'Last Name',
        type: 'text',
        required: true,
        value: '',
        group: 'personal'
      },
      field3: {
        id: 'field3',
        label: 'Email',
        type: 'email',
        required: true,
        value: '',
        group: 'contact'
      },
      field4: {
        id: 'field4',
        label: 'Notifications',
        type: 'checkbox',
        required: false,
        value: true,
        group: 'settings'
      }
    },
    editable: true
  };
  
  clearFields();
  
  // Load rows
  exampleJson.rows.forEach(rowData => {
    const row = new FormRow();
    row.id = rowData.id;
    formStructure.rows.push({
      id: row.id,
      fields: []
    });
    document.getElementById('fields-container').appendChild(row.element);
  });
  
  // Load groups
  Object.entries(exampleJson.groups).forEach(([name, groupData]) => {
    const group = new FieldGroup(groupData.name, groupData.rowId);
    formStructure.groups[name] = group;
    
    const rowElement = document.querySelector(`[data-row-id="${groupData.rowId}"]`);
    rowElement.appendChild(group.element);
  });
  
  // Load fields
  Object.entries(exampleJson.fields).forEach(([id, fieldData]) => {
    const field = new FormField(fieldData);
    formStructure.fields[id] = field;
    formStructure.rows.find(row => row.id === formStructure.groups[fieldData.group].rowId)
      .fields.push(id);
    
    formStructure.groups[fieldData.group].fieldsContainer.appendChild(field.element);
  });
  
  formStructure.editable = exampleJson.editable;
  document.getElementById('edit-toggle').checked = formStructure.editable;
  toggleEditState();
  updateRowSelect();
  updateJsonOutput();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('edit-toggle').addEventListener('change', toggleEditState);
  updateRowSelect();
  updateJsonOutput();
});