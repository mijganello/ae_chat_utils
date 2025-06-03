import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import ruLocale from 'date-fns/locale/ru';  // Для локализации на русском языке

const formatDate = (dateString) => {
    const date = new Date(dateString);

    // Если дата сегодняшняя
    if (isToday(date)) {
        return format(date, 'Сегодня', { locale: ruLocale });
    }

    // Если дата вчерашняя
    if (isYesterday(date)) {
        return 'Вчера';
    }

    // Если дата позавчерашняя
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    if (date.toDateString() === twoDaysAgo.toDateString()) {
        return 'Позавчера';
    }

    // Если дата из текущего года
    if (isThisYear(date)) {
        return format(date, 'd MMMM', { locale: ruLocale });
    }

    // Если дата из другого года
    return format(date, 'd MMMM yyyy', { locale: ruLocale });
};

export default formatDate;