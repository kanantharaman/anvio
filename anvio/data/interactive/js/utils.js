//--------------------------------------------------------------------------------------------------
// http://stackoverflow.com/questions/3019278/any-way-to-specify-the-base-of-math-log-in-javascript
function log10(val) {
  return Math.log(val) / Math.LN10;
}

//--------------------------------------------------------------------------------------------------
// http://stackoverflow.com/questions/1303646/check-whether-variable-is-number-or-string-in-javascript
function isNumber (o) {
  return ! isNaN (o-0);
}

//--------------------------------------------------------------------------------------------------
function ctype_alnum (str)
{
    return (str.match(/^[a-z0-9]+$/i) != null);
}

//--------------------------------------------------------------------------------------------------
function strip(html)
{
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

//--------------------------------------------------------------------------------------------------
function clearMinMax(selectbox) 
{
    var id = $(selectbox).attr('id').replace('normalization', '');

    $('#min' + id).val('0').prop('disabled', true);
    $('#max' + id).val('0').prop('disabled', true);     
}

/* Poor man's timer.
 * 
 *     function ...(...) {
 *         var my_timer = new BasicTimer('my_func');
 *         (...)
 *         my_timer.getDeltaSeconds('X happened');
 *         (...)
 *         my_timer.getDeltaSeconds('Y happened');
 *         (...)
 *         my_timer.getDeltaSeconds('End');
 *     }
 *
 */ 
function BasicTimer(name) {
    this.name = name;
    this.start = new Date().getTime();
    this.previousDelta = this.start;

    this.getDeltaSeconds = function(event, consoleOutput) {
        this.now = new Date().getTime();
        deltaSecondsStart = (this.now - this.start) / 1000;
        deltaSecondsPrev = (this.now - this.previousDelta) / 1000;

        this.previousDelta = this.now;
        
        consoleOutput = typeof consoleOutput !== 'undefined' ? consoleOutput: true;

        prettyText = this.name + ' [' + event + ']: ' + readableNumber(deltaSecondsPrev) + ' seconds (' + readableNumber(deltaSecondsStart) + ' seconds since beginning)';

        if(consoleOutput)
            console.log(prettyText);

        return {'deltaSecondsStart': deltaSecondsStart, 'deltaSecondsPrev': deltaSecondsPrev, 'prettyText': prettyText};
    };
}

//--------------------------------------------------------------------------------------------------
// source: https://gist.github.com/cjthompson/9140248
function readableNumber(num) {
    if(num == 0)
        return 0;
    if(num < 1)
        return num;
    var s = ['', 'K', 'M', 'G'];
    var e = Math.floor(Math.log(num) / Math.log(1000));
    return (num / Math.pow(1000, e)).toPrecision(3) + s[e];
}

//--------------------------------------------------------------------------------------------------
function linePath(p0, p1)
{
    var path = 'M ' + p0['x'] + ' ' + p0['y'] + ' ' + p1['x'] + ' ' + p1['y'];
    return path;
}

//--------------------------------------------------------------------------------------------------
function distance(p0, p1)
{
    return Math.sqrt(Math.pow(p1['x'] - p0['x'],2) + Math.pow(p1['y'] + p0['y'],2));
}

// http://stackoverflow.com/questions/498970/how-do-i-trim-a-string-in-javascript
if (!String.prototype.trim)
{
    String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};
}

Math.toRadians = function(degrees) {
    return degrees * Math.PI / 180;
};

Math.toDegrees = function(radians) {
    return radians * 180 / Math.PI;
};


//--------------------------------------------------------------------------------------------------
//  Iterator
//--------------------------------------------------------------------------------------------------
function NodeIterator(root)
{
    this.root = root;
    this.cur = null;
    this.stack = [];
}

//--------------------------------------------------------------------------------------------------
NodeIterator.prototype.Begin = function() 
{
    this.cur = this.root;
    while (this.cur.child)
    {
        this.stack.push(this.cur);
        this.cur = this.cur.child;
    }
    return this.cur;
}

//--------------------------------------------------------------------------------------------------
NodeIterator.prototype.Next = function() 
{
    if (this.stack.length == 0)
    {
        this.cur = null;
    }
    else
    {
        if (this.cur.sibling)
        {
            var p = this.cur.sibling;
            while (p.child)
            {
                this.stack.push(p);
                p = p.child;
            }
            this.cur = p;
        }
        else
        {
            this.cur = this.stack.pop();
        }
    }
    return this.cur;
}

//--------------------------------------------------------------------------------------------------
PreorderIterator.prototype = new NodeIterator;

function PreorderIterator()
{
    NodeIterator.apply(this, arguments)
};

//--------------------------------------------------------------------------------------------------
PreorderIterator.prototype.Begin = function() 
{
    this.cur = this.root;
    return this.cur;
}

//--------------------------------------------------------------------------------------------------
PreorderIterator.prototype.Next = function() 
{
    if (this.cur.child)
    {
        this.stack.push(this.cur);
        this.cur = this.cur.child;
    }
    else
    {
        while (this.stack.length > 0 && this.cur.sibling == null)
        {
            this.cur = this.stack.pop();
        }
        if (this.stack.length == 0)
        {
            this.cur = null;
        }
        else
        {
            this.cur = this.cur.sibling;
        }
    }
    return this.cur;
}
//---------------------------------------------------------
//  Initialize dialogs and other dialog functions
//---------------------------------------------------------

function initializeDialogs() {

    // dialogs without close button

    $('.dialogs').dialog({
        resizable: false,
        width: 'auto',
        collapseEnabled: true,
        closeOnEscape: false,
        beforeclose: function(event, ui) {
            return false;
        },
        open: function(event, ui) { $(".ui-dialog-titlebar-close", $(this).parent()).hide(); }
    });

    $("#zoomDialog").dialog("option", "title", "Zoom").dialog("option", "position", {
            my: "right bottom",
            at: "right bottom",
            of: window
        });

    $("#treeControls").dialog("option", "title", "Tree Settings").dialog("option", "position", {
            my: "left top",
            at: "left top",
            of: window
        });

    $("#groups").dialog("option", "title", "Groups").dialog("option", "position", {
            my: "right-20px top",
            at: "right-20px top",
            of: window
        }).dialog('option', 'minHeight', 0);

    // diaglos with close button.

    $(".dialogs2").dialog({
            resizable: false,
            collapseEnabled: false,
            width: 'auto',
            position: {
                my: "center",
                at: "center",
                of: window
            }}).dialog('close');

    $('#searchBox').dialog("option", "title", "Search");
    $('#storeCollectionWindow').dialog("option", "title", "Store Collection");
    $('#loadCollectionWindow').dialog("option", "title", "Load Collection");


}
//---------------------------------------------------------
//  message popup
//---------------------------------------------------------
function messagePopupShow(title, context)
{
    $('<div> \
        <textarea id="messagePopup_context" onclick="this.focus();this.select();" readonly="readonly" style="width: 400px; height: 300px">' + context + '</textarea> \
       </div>').dialog({
            resizable: false,
            collapseEnabled: false,
            width: 'auto',
            title: title,
            position: {
                my: "center",
                at: "center",
                of: window
            },
            close: function(ev, ui) {
                $(this).remove();
            }});
}


//---------------------------------------------------------
// Metadata operations
//---------------------------------------------------------

function removeSingleParents()
{
    // metadata and parameter count is global

    for (var i = 1; i < parameter_count; i++) 
    {
        if (metadata[0][i] == '__parent__') 
        {
            var parent_count_dict = {};
            for (var j=1; j < metadata.length; j++)
            {
                if (metadata[j][i]=='')
                    continue;

                if (typeof parent_count_dict[metadata[j][i]] === 'undefined')
                {
                    parent_count_dict[metadata[j][i]] = 1;
                }
                else
                {
                    parent_count_dict[metadata[j][i]]++;
                }
            }

            $.each(parent_count_dict, function(parent_name, count)
            {
                if (count==1)
                {
                    for (var j=1; j < metadata.length; j++)
                    {
                        if (metadata[j][i]==parent_name)
                        {
                            metadata[j][i]='';
                        }
                    }
                }
            });
        }
    }
}

//---------------------------------------------------------
// jquery table sort helper
//---------------------------------------------------------
var fixHelperModified = function(e, tr) {
    var $originals = tr.children();
    var $helper = tr.clone();
    $helper.children().each(function(index) {
        $(this).width($originals.eq(index).width());
    });
    return $helper;
};

//---------------------------------------------------------
//  zoom and scale
//---------------------------------------------------------
function getMatrix() {
    var viewport = document.getElementById('viewport');
    return viewport.getAttribute('transform').split('(')[1].split(')')[0].split(',').map(parseFloat);
}

function setMatrix(matrix) {
    var viewport = document.getElementById('viewport');
    viewport.setAttribute('transform', 'matrix(' + matrix.join(',') + ')');
}

function zoom(scale) {
    matrix = getMatrix(viewport);

    for (var i = 0; i < matrix.length; i++) {
        matrix[i] *= scale;
    }

    bbox = viewport.getBBox();

    matrix[4] += (1 - scale) * VIEWER_WIDTH / 2;
    matrix[5] += (1 - scale) * VIEWER_HEIGHT / 2;

    setMatrix(matrix);
}

function pan(dx, dy) {
    matrix = getMatrix();

    matrix[4] += dx;
    matrix[5] += dy;

    setMatrix(matrix);
}

function zoom_reset() {
    baseMatrix = [1 * scale, 0, 0, 1 * scale, VIEWER_WIDTH / 2, VIEWER_HEIGHT / 2];
    setMatrix(baseMatrix);
}