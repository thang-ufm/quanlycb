document.addEventListener('DOMContentLoaded', () => {
    // Initialize one row in the batch modal
    if(document.getElementById('taskTableBody')){
        addTaskRow();
    }
});

function createSelectOptions(data, isMultiple) {
    let html = '';
    if (!isMultiple) html += `<option value="">-- Chọn --</option>`;
    data.forEach(item => {
        html += `<option value="${item.id}">${item.name}</option>`;
    });
    return html;
}

function addTaskRow() {
    const tbody = document.getElementById('taskTableBody');
    const tr = document.createElement('tr');
    tr.className = 'border-b hover:bg-gray-50';

    tr.innerHTML = `
        <td class="py-2 px-3 align-top">
            <input type="text" name="title[]" class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none" required placeholder="Nhập tên CV">
        </td>
        <td class="py-2 px-3 align-top">
            <input type="text" name="description[]" class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none" placeholder="Mô tả ngắn">
        </td>
        <td class="py-2 px-3 align-top">
            <select name="department_id[]" class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none" required>
                ${createSelectOptions(departmentsData, false)}
            </select>
        </td>
        <td class="py-2 px-3 align-top">
            <select name="assignee_id[]" class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none" required>
                ${createSelectOptions(usersData, false)}
            </select>
        </td>
        <td class="py-2 px-3 align-top">
            <select name="collaborators[]" multiple class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none text-xs" style="height: 60px">
                ${createSelectOptions(usersData, true)}
            </select>
            <div class="text-[10px] text-gray-400 mt-1">Giữ Ctrl/Cmd để chọn nhiều</div>
        </td>
        <td class="py-2 px-3 align-top">
            <select name="priority[]" class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none" required>
                <option value="Thấp">Thấp</option>
                <option value="Trung bình" selected>Trung bình</option>
                <option value="Cao">Cao</option>
                <option value="Quan trọng">Quan trọng</option>
            </select>
        </td>
        <td class="py-2 px-3 align-top">
            <input type="date" name="deadline[]" class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none" required>
        </td>
        <td class="py-2 px-3 align-top text-center">
            <button type="button" onclick="this.closest('tr').remove()" class="text-red-500 hover:text-red-700 mt-1">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    tbody.appendChild(tr);
}

async function submitBatchTasks() {
    const tbody = document.getElementById('taskTableBody');
    const rows = tbody.querySelectorAll('tr');

    if(rows.length === 0) {
        alert("Vui lòng thêm ít nhất 1 công việc!");
        return;
    }

    const tasks = [];
    let isValid = true;

    rows.forEach(row => {
        const title = row.querySelector('[name="title[]"]').value;
        const dept = row.querySelector('[name="department_id[]"]').value;
        const assignee = row.querySelector('[name="assignee_id[]"]').value;
        const deadline = row.querySelector('[name="deadline[]"]').value;

        if(!title || !dept || !assignee || !deadline) {
            isValid = false;
        }

        const collabSelect = row.querySelector('[name="collaborators[]"]');
        const collaborators = Array.from(collabSelect.selectedOptions).map(opt => parseInt(opt.value));

        tasks.push({
            title: title,
            description: row.querySelector('[name="description[]"]').value,
            department_id: parseInt(dept),
            assignee_id: parseInt(assignee),
            priority: row.querySelector('[name="priority[]"]').value,
            deadline: deadline + "T23:59:59", // Default end of day
            collaborator_ids: collaborators
        });
    });

    if(!isValid) {
        alert("Vui lòng điền đầy đủ các trường bắt buộc (*)!");
        return;
    }

    try {
        const response = await fetch('/tasks/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tasks)
        });

        if(response.ok) {
            alert("Đăng ký công việc thành công!");
            window.location.reload();
        } else {
            const data = await response.json();
            alert("Lỗi: " + data.detail);
        }
    } catch (error) {
        alert("Lỗi kết nối server!");
        console.error(error);
    }
}
