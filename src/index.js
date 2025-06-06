// src/index.js

/**
 * Функция для группировки сообщений по дате и автору.
 * @param {Object} apiResponse - Ответ от API с массивом сообщений.
 * @returns {Array} Сгруппированные сообщения с day.
 **/
function divideMessagesForRendering(apiResponse) {
    const messages = apiResponse.result.messages;

    if (!Array.isArray(messages)) {
        throw new Error("Некорректный формат ответа от API");
    }

    const groupedMessages = [];
    let currentGroup = [];
    let currentDate = null;
    let currentAuthor = null;

    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const messageDate = new Date(message.created).toISOString().split('T')[0]; // Получаем дату в формате YYYY-MM-DD

        // Если дата или автор изменились, закрываем текущую группу и начинаем новую
        if (currentDate !== messageDate || currentAuthor !== message.author_uid) {
            if (currentGroup.length > 0) {
                groupedMessages.push(currentGroup);
            }

            if (currentDate !== messageDate) {
                groupedMessages.push({ type: 'day', date: messageDate });
            }

            currentGroup = [];
            currentDate = messageDate;
            currentAuthor = message.author_uid;
        }

        // Добавляем сообщение в текущую группу
        currentGroup.push(message);
    }

    // Добавляем последнюю группу, если она не пуста
    if (currentGroup.length > 0) {
        groupedMessages.push(currentGroup);
    }

    return groupedMessages;
}

/**
 * Функция для добавления старых сообщений в уже существующий массив.
 * @param {Object} newDirtyResponse - Ответ от API с новыми сообщениями (старыми по дате).
 * @param {Array} oldCleanMessages - Уже сгруппированные сообщения.
 * @returns {Array} Обновлённый массив сообщений.
 **/
function mergeOldMessages(newDirtyResponse, oldCleanMessages) {
    const newDirtyMessages = newDirtyResponse.result.messages;

    if (!Array.isArray(newDirtyMessages)) {
        throw new Error("Некорректный формат ответа от API для новых сообщений");
    }

    // Если в oldCleanMessages нет day, фильтруем и группируем только dirty сообщения
    const firstDayGroup = oldCleanMessages.find(group => group.type === 'day');
    if (!firstDayGroup) {
        const regroupedMessages = divideMessagesForRendering({ result: { messages: newDirtyMessages } });
        return [...regroupedMessages, ...oldCleanMessages];
    }

    const firstDay = firstDayGroup.date;

    // Находим все группы сообщений по первой дате
    const messagesToRemove = oldCleanMessages.filter(group =>
        Array.isArray(group) && group.length > 0 &&
        new Date(group[0].created).toISOString().split('T')[0] === firstDay
    );

    // Удаляем их и соответствующий day из старого массива
    const remainingOldCleanMessages = oldCleanMessages.filter(group => {
        if (group.type === 'day' && group.date === firstDay) {
            return false; // Удаляем совпадающий day-group
        }
        return !messagesToRemove.includes(group);
    });

    // Добавляем сообщения из этих групп в конец "грязного" списка
    for (const group of messagesToRemove) {
        for (const message of group) {
            newDirtyMessages.push(message);
        }
    }

    // Группируем новый список старых сообщений
    const regroupedMessages = divideMessagesForRendering({ result: { messages: newDirtyMessages } });

    // Объединяем два массива: новый чистый список старых сообщений и оставшиеся старые сообщения
    return [...regroupedMessages, ...remainingOldCleanMessages];
}

/**
 Пример события в сокете на приём нового сообщения:

 {
 "type": "send_message",
 "data": {
 "id": 220,
 "text": "hellomir",
 "author_uid": 1,
 "created": "2023-07-17 15:47:30",
 "chat_id": 215,
 "status": 1
 }
 }
 **/

/**
 * Функция для добавления нового сообщения в уже сгруппированный массив.
 * @param {Object} socketEvent - Событие сокета, содержащее данные нового сообщения.
 * @param {Array} groupedMessages - Массив сгруппированных сообщений.
 * @returns {Array} Обновлённый массив сгруппированных сообщений.
 *
 * Логика:
 * 1. Проверяет дату нового сообщения.
 * 2. Если дата совпадает с последним объектом даты (day-group):
 *    - Проверяет автора последнего сообщения в группе.
 *    - Если автор совпадает, добавляет сообщение в ту же группу.
 *    - Если автор не совпадает, создаёт новую группу сообщений.
 * 3. Если дата не совпадает с последним day-group, создаёт новый day-group и группу сообщений.
 */
function addNewMessage(socketEvent, groupedMessages) {
    const newMessage = socketEvent.data;
    const messageDate = new Date(newMessage.created).toISOString().split('T')[0];

    // Создаём копию groupedMessages:
    // Если группы являются массивами или объектами, нужно копировать их глубже.
    const newGroupedMessages = groupedMessages.map(group =>
        Array.isArray(group) ? [...group] : { ...group }
    );

    const lastElement = newGroupedMessages[newGroupedMessages.length - 1];

    if (lastElement && lastElement.type === 'day') {
        if (lastElement.date === messageDate) {
            // Получаем предыдущую группу сообщений (если есть)
            const lastGroupIndex = newGroupedMessages.length - 2;
            if (lastGroupIndex >= 0 && Array.isArray(newGroupedMessages[lastGroupIndex])) {
                const lastMessageGroup = newGroupedMessages[lastGroupIndex];
                const lastMessage = lastMessageGroup[lastMessageGroup.length - 1];

                if (lastMessage.author_uid === newMessage.author_uid) {
                    // Добавляем сообщение в существующую группу
                    lastMessageGroup.push(newMessage);
                } else {
                    // Если автор отличается — создаём новую группу
                    newGroupedMessages.push([newMessage]);
                }
            } else {
                newGroupedMessages.push([newMessage]);
            }
        } else {
            // Если дата не совпадает — создаём новую day-группу и группу сообщений
            newGroupedMessages.push({ type: 'day', date: messageDate });
            newGroupedMessages.push([newMessage]);
        }
    } else if (Array.isArray(lastElement)) {
        const lastMessage = lastElement[lastElement.length - 1];
        const lastMessageDate = new Date(lastMessage.created).toISOString().split('T')[0];

        if (lastMessageDate === messageDate) {
            if (lastMessage.author_uid === newMessage.author_uid) {
                lastElement.push(newMessage);
            } else {
                newGroupedMessages.push([newMessage]);
            }
        } else {
            newGroupedMessages.push({ type: 'day', date: messageDate });
            newGroupedMessages.push([newMessage]);
        }
    } else {
        // Если массив пуст или последний элемент некорректный
        newGroupedMessages.push({ type: 'day', date: messageDate });
        newGroupedMessages.push([newMessage]);
    }

    return newGroupedMessages;
}


function createSocketConnection(url) {
    // Создаём новый объект WebSocket и начинаем подключение
    const socket = new WebSocket(url);

    // Обработчик события успешного подключения
    socket.onopen = function() {
        console.log(`Соединение установлено с ${url}`);
    };

    // Обработчик входящих сообщений
    socket.onmessage = function(event) {
        console.log("Получено сообщение:", event.data);
    };

    // Обработчик ошибок
    socket.onerror = function(error) {
        console.error("Ошибка сокета:", error);
    };

    // Обработчик закрытия соединения
    socket.onclose = function() {
        console.log("Соединение закрыто");
    };

    // Возвращаем объект сокета
    return socket;
}


const getCookie = (name) => {
    const matches = document.cookie.match(
        new RegExp(
            // Экранируем специальные символы в имени куки
            // eslint-disable-next-line no-useless-escape
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        )
    );
    return matches ? decodeURIComponent(matches[1]) : undefined;
};



module.exports = {
    divideMessagesForRendering,
    mergeOldMessages,
    addNewMessage,
    createSocketConnection,
    getCookie
};
