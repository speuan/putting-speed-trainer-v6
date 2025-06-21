/**
 * Checks if the line segment from p1 to p2 intersects with the line segment from p3 to p4.
 * This is a standard algorithm based on the orientation of ordered triplets.
 * @param {object} p1 - Point {x, y}
 * @param {object} p2 - Point {x, y}
 * @param {object} p3 - Point {x, y}
 * @param {object} p4 - Point {x, y}
 * @returns {boolean} - True if they intersect
 */
export function lineIntersect(p1, p2, p3, p4) {

    function onSegment(p, q, r) {
        return (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
                q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y));
    }

    function orientation(p, q, r) {
        const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
        if (val === 0) return 0;  // Collinear
        return (val > 0) ? 1 : 2; // Clockwise or Counterclockwise
    }

    const o1 = orientation(p1, p2, p3);
    const o2 = orientation(p1, p2, p4);
    const o3 = orientation(p3, p4, p1);
    const o4 = orientation(p3, p4, p2);

    // General case
    if (o1 !== o2 && o3 !== o4) {
        return true;
    }

    // Special Cases for when points are collinear
    if (o1 === 0 && onSegment(p1, p3, p2)) return true;
    if (o2 === 0 && onSegment(p1, p4, p2)) return true;
    if (o3 === 0 && onSegment(p3, p1, p4)) return true;
    if (o4 === 0 && onSegment(p3, p2, p4)) return true;

    return false;
} 