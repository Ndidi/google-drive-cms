/** --------------------- */
/**    CELL FUNCITONS     */
/** --------------------- */

/**
 * Slugifies a text input.
 *
 * @param {string} text to slugify.
 * @return The input slugified (lowercase, no spaces or non-word characters).
 * @customfunction
 */
function SLUGIFY(input) {
  return input.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
} 
