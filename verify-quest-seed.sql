SELECT type, COUNT(*) as count 
FROM opportunities 
WHERE type = 'quest' 
GROUP BY type;
