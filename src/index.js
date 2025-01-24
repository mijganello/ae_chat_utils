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

    // Найти последний объект в массиве
    const lastElement = groupedMessages[groupedMessages.length - 1];

    if (lastElement && lastElement.type === 'day') {
        // Последний элемент — day-group
        if (lastElement.date === messageDate) {
            // Дата совпадает, добавляем в последнюю группу
            const lastMessageGroup = groupedMessages[groupedMessages.length - 2];

            if (Array.isArray(lastMessageGroup)) {
                const lastMessage = lastMessageGroup[lastMessageGroup.length - 1];

                // Если автор последнего сообщения совпадает
                if (lastMessage.author_uid === newMessage.author_uid) {
                    lastMessageGroup.push(newMessage);
                } else {
                    // Создаём новую группу сообщений
                    groupedMessages.push([newMessage]);
                }
            } else {
                // Если последняя группа не массив, создаём новую
                groupedMessages.push([newMessage]);
            }
        } else {
            // Дата не совпадает, создаём новый day-group и группу сообщений
            groupedMessages.push({ type: 'day', date: messageDate });
            groupedMessages.push([newMessage]);
        }
    } else if (Array.isArray(lastElement)) {
        // Последний элемент — массив сообщений
        const lastMessage = lastElement[lastElement.length - 1];
        const lastMessageDate = new Date(lastMessage.created).toISOString().split('T')[0];

        if (lastMessageDate === messageDate) {
            // Дата совпадает, проверяем автора
            if (lastMessage.author_uid === newMessage.author_uid) {
                lastElement.push(newMessage);
            } else {
                groupedMessages.push([newMessage]);
            }
        } else {
            // Дата не совпадает
            groupedMessages.push({ type: 'day', date: messageDate });
            groupedMessages.push([newMessage]);
        }
    } else {
        // Если массив пуст или последний элемент некорректный
        groupedMessages.push({ type: 'day', date: messageDate });
        groupedMessages.push([newMessage]);
    }

    return groupedMessages;
}


module.exports = {
    divideMessagesForRendering,
    mergeOldMessages,
    addNewMessage,
};
