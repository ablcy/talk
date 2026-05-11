class AdminPanel {
    constructor() {
        this.baseUrl = window.location.origin;
        this.users = [];
        this.filteredUsers = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStats();
        this.loadUsers();
        this.addLog('Tell Admin v1.0.0 启动成功', '系统');
    }

    bindEvents() {
        document.getElementById('refresh-btn').addEventListener('click', () => this.loadUsers());
        document.getElementById('search-user-search').addEventListener('input', (e) => this.searchUsers(e.target.value));
        document.getElementById('clear-logs-btn').addEventListener('click', () => this.clearLogs());
    }

    async loadStats() {
        try {
            const [usersRes, messagesRes, friendshipsRes] = await Promise.all([
                fetch(`${this.baseUrl}/api/admin/stats/users`),
                fetch(`${this.baseUrl}/api/admin/stats/messages`),
                fetch(`${this.baseUrl}/api/admin/stats/friendships`)
            ]);

            const usersData = await usersRes.json();
            const messagesData = await messagesRes.json();
            const friendshipsData = await friendshipsRes.json();

            document.getElementById('total-users').textContent = usersData.count || 0;
            document.getElementById('total-messages').textContent = messagesData.count || 0;
            document.getElementById('total-friendships').textContent = friendshipsData.count || 0;
        } catch (error) {
            console.error('Load stats error:', error);
        }
    }

    async loadUsers() {
        try {
            const response = await fetch(`${this.baseUrl}/api/admin/users`);
            const data = await response.json();

            if (data.success) {
                this.users = data.users;
                this.filteredUsers = data.users;
                this.renderUsers();
                this.addLog('用户列表已刷新', '系统');
            }
        } catch (error) {
            console.error('Load users error:', error);
        }
    }

    renderUsers() {
        const tbody = document.getElementById('users-table-body');
        
        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">暂无用户</td></tr>';
            return;
        }

        tbody.innerHTML = this.filteredUsers.map(user => {
            const createdAt = user.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '未知';
            return `
                <tr>
                    <td><div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div></td>
                    <td class="user-id">${user.id}</td>
                    <td>${user.username}</td>
                    <td>${createdAt}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="admin.deleteUser('${user.id}', '${user.username}')">删除</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    searchUsers(keyword) {
        if (!keyword) {
            this.filteredUsers = this.users;
        } else {
            this.filteredUsers = this.users.filter(u => 
                u.username.toLowerCase().includes(keyword.toLowerCase()) ||
                u.id.toLowerCase().includes(keyword.toLowerCase())
            );
        }
        this.renderUsers();
    }

    async deleteUser(userId, username) {
        if (!confirm(`确定要删除用户 ${username} 吗？此操作不可恢复！`)) return;

        try {
            const response = await fetch(`${this.baseUrl}/api/admin/users/${userId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.loadUsers();
                this.loadStats();
                this.addLog(`用户 ${username} 已删除`, '删除');
            } else {
                alert('删除失败');
            }
        } catch (error) {
            console.error('Delete user error:', error);
            alert('删除失败');
        }
    }

    addLog(message, type = '信息') {
        const logsContainer = document.getElementById('logs-container');
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-CN');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `<span class="log-time">[${timeStr}]</span><span class="log-message">${message}</span>`;
        logsContainer.appendChild(logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    clearLogs() {
        document.getElementById('logs-container').innerHTML = '<div class="log-entry"><span class="log-time">[系统]</span><span class="log-message">日志已清空</span></div>';
    }
}

const admin = new AdminPanel();