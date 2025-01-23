// src/index.js

/**
 * Функция для группировки сообщений по дате и автору.
 * @param {Object} apiResponse - Ответ от API с массивом сообщений.
 * @returns {Array} Сгруппированные сообщения с day.
 */
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
 */
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

module.exports = {
    divideMessagesForRendering,
    mergeOldMessages,
};
