/**
 * 旅圖集 Travel Atlas — AI 旅遊顧問
 * 由 app.js 在切換頁面時呼叫 TravelAtlasChat.setContext() 更新角色與行程背景。
 */
(function () {
    'use strict';

    const API_KEY = '';
    const MODEL = 'gemini-3-flash-preview';

    const toggleBtn = document.getElementById('ai-chat-toggle');
    const widget = document.getElementById('ai-chat-widget');
    const closeBtn = document.getElementById('ai-chat-close');
    const messages = document.getElementById('ai-chat-messages');
    const input = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-chat-send');
    const nameEl = document.getElementById('ai-chat-name');

    let systemPrompt = '';
    let history = [];
    let contextKey = null;

    const esc = (s) =>
        String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    /** 切換對話角色（每段旅程獨立對話） */
    function setContext(ctx) {
        const key = ctx.name + '|' + ctx.prompt;
        if (key === contextKey) return;
        contextKey = key;

        systemPrompt = ctx.prompt;
        history = [];
        nameEl.textContent = ctx.name;

        const suggestions = (ctx.suggestions || [])
            .map((s) => `<li><button type="button" data-suggest="${esc(s)}" class="text-left hover:text-nordic-accent1 transition-colors"><i class="fa-solid fa-angle-right text-[10px] mr-1"></i>${esc(s)}</button></li>`)
            .join('');

        messages.innerHTML = `
            <div class="flex justify-start">
                <div class="chat-bubble-ai p-3 max-w-[85%] shadow-sm leading-relaxed">
                    ${ctx.greeting}
                    ${suggestions ? `<ul class="mt-2 text-nordic-muted space-y-1">${suggestions}</ul>` : ''}
                </div>
            </div>`;
    }

    input.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
        if (this.value === '') this.style.height = '42px';
    });

    toggleBtn.addEventListener('click', () => {
        widget.classList.add('active');
        toggleBtn.style.transform = 'scale(0)';
        toggleBtn.style.opacity = '0';
        input.focus();
    });

    closeBtn.addEventListener('click', () => {
        widget.classList.remove('active');
        toggleBtn.style.transform = 'scale(1)';
        toggleBtn.style.opacity = '1';
    });

    messages.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-suggest]');
        if (btn) sendMessage(btn.dataset.suggest);
    });

    async function sendMessage(preset) {
        const text = (preset ?? input.value).trim();
        if (!text) return;

        appendMessage(text, 'user');
        input.value = '';
        input.style.height = '42px';

        history.push({ role: 'user', parts: [{ text }] });
        const typingId = appendTypingIndicator();
        scrollToBottom();

        try {
            const reply = await callGeminiAPI(history);
            removeElement(typingId);
            appendMessage(reply, 'model');
            history.push({ role: 'model', parts: [{ text: reply }] });
        } catch (err) {
            console.error('API Error:', err);
            removeElement(typingId);
            appendMessage('不好意思，我現在腦筋有點打結（網路連線異常），請稍後再試試看！', 'model');
        }
        scrollToBottom();
    }

    sendBtn.addEventListener('click', () => sendMessage());
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            sendMessage();
        }
    });

    function appendMessage(text, sender) {
        const row = document.createElement('div');
        row.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
        const bubble = document.createElement('div');
        bubble.className = `p-3 max-w-[85%] shadow-sm text-sm leading-relaxed ${sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`;
        bubble.innerHTML = esc(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        row.appendChild(bubble);
        messages.appendChild(row);
    }

    function appendTypingIndicator() {
        const id = 'typing-' + Date.now();
        const row = document.createElement('div');
        row.id = id;
        row.className = 'flex justify-start';
        row.innerHTML = `<div class="chat-bubble-ai p-3 max-w-[85%] shadow-sm typing-indicator flex items-center h-11"><span></span><span></span><span></span></div>`;
        messages.appendChild(row);
        return id;
    }

    function removeElement(id) {
        document.getElementById(id)?.remove();
    }

    function scrollToBottom() {
        messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
    }

    async function callGeminiAPI(contents, attempt = 1) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: systemPrompt }] } }),
        });

        if (response.status === 429) {
            if (attempt <= 3) {
                await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
                return callGeminiAPI(contents, attempt + 1);
            }
            throw new Error('Rate limit exceeded after retries');
        }
        if (!response.ok) throw new Error(`API Request Failed with status ${response.status}`);

        const result = await response.json();
        const part = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!part) throw new Error('Unexpected response structure');
        return part;
    }

    window.TravelAtlasChat = { setContext, sendMessage };
})();
