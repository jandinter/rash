/*
 *
 * rash-inline.js - Version 0.0.1
 * Copyright (c) 2016, Gianmarco Spinaci <spino9330@gmail.com>
 *
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
 * OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
 * IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 */

var rash_inline_selector = '#rashEditor',
  section_abstract_selector = 'section[role=\"doc-abstract\"]',
  section_bibliography_selector = 'section[role=\"doc-bibliography\"]',
  section_acknowledgement_selector = 'section[role=\"doc-acknowledgements\"]',
  section_footnotes_selector = 'section[role=\"doc_footnotes\"]';

var meta_headers_selector = 'h1.title, strong.author_name, code.email, span.affiliation, p.keywords>ul.list-inline, p.acm_subject_categories>code';

window['bodyContent'] = ''
edit_state = false

// If there isn't any githubToken, editable starts with true to change and hide navbar
editable = false
window['settings'] = {}

jQuery.fn.extend({
  setEditable: function () {
    $(this).attr('contenteditable', true);
    $(this).attr('spellcheck', true);
    $('span.editgen').show();
    $('#editNavar').show();

    //Remove href
    $('header.page-header code.email>a').each(function () {
      $(this).removeAttr('href')
    })

    $('footer.footer').hide()

    /** hide endnote back button */
    $('section[role="doc-endnote"]').each(function () {
      $(this).find('sup.cgen').hide()
    })

    /** 
     * Check if body has been modified yet 
     * If current body and saved body are equal, edit_state is false (not modified)
     * otherwise edit_state is true
     */
    $(this).on('input', function () {
      edit_state = $(rash_inline_selector).html() != bodyContent
      setEditState()
    })

    /**
     * Get when call event to disable or activate toolbar elements
     */
    $(this).on('click', function () {
      refreshToolbar()
    })
    $(this).bind('keydown', function () {
      refreshToolbar()
    })

  },
  setNotEditable: function () {
    $(this).attr('contenteditable', false);
    $('span.editgen').hide();
    $('#editNavar').hide();

    //Reset attr
    $('header.page-header code.email>a').each(function () {
      $(this).attr('href', 'mailto:' + $(this).text())
    })

    $('footer.footer').show()

    /** show endnote back button */
    $('section[role="doc-endnote"]').each(function () {
      $(this).find('sup.cgen').show()
    })
  },

  getNextFormulaID: function () {
    let id = 0
    $(formulabox_selector_rendered).each(function () {
      id = Math.max(id, parseInt($(this).attr('id').replace('formula_')))
    })
    return ++id
  },

  removeElement: function () {
    var toDeleteSpan = $(this);
    toDeleteSpan.replaceWith(toDeleteSpan.get(0).innerHTML);
  },

  appendChildren: function (number, childrenType) {
    while (number-- > 0) {
      $(this).append($(childrenType));
    }
  },
  hasAbstract: function () {
    return $(this).has('section[role=\"doc-abstract\"]').length;
  },
  hasAcknowledgments: function () {
    return $(this).has('section[role=\"doc-acknowledgements\"]').length;
  },
  hasBibliography: function () {
    return $(this).has('section[role=\"doc-bibliography\"]').length;
  },
  hasEndnotes: function () {
    return $(this).has('section[role=\"doc-endnotes\"]').length;
  },
  trimChar: function () {
    $(this).contents().filter(function () {
      return this.nodeType === 3 && $.trim(this.nodeValue).length;
    }).replaceWith('');
  },
  /** Remove all text outside elements
   * Because in rash text outside elements is not allowed
   */
  sanitizeFromSpecialChars: function () {
    $(this).parent().contents()
      .filter(function () {
        return this.nodeType == 3
      })
      .replaceWith('')
  }
});

window.handleInline = function (type) {
  window[type] = new rashEditor.inline(type);
  window[type].add();
  return false;
};

window.handleExternalLink = function () {
  window['externalLink'] = new rashEditor.externalLink();
  window['externalLink'].showModal();
};

window.handleCrossRef = function () {
  window['crossReference'] = new rashEditor.crossRef();
  window['crossReference'].showModal();
};

window.handleTableBox = function () {
  var id = 'table_' + ($(this).findNumber(tablebox_selector) + 1);
  window[id] = new rashEditor.Table(id);
  window[id].add();
};

window.handleFigureBox = function () {
  var id = 'figure_' + ($(this).findNumber(figurebox_selector) + 1);
  window[id] = new rashEditor.Figure(id)
  window[id].showModal();
}

window.handleFormulaBox = function () {
  var id = 'formula_' + $(rash_inline_selector).getNextFormulaID()
  window[id] = new rashEditor.Formula(id);
  window[id].showModal();
};

$(document).ready(function () {

  /* START .rash_inline */
  var inline = $('<div id=\"rashEditor\" class=\"cgen editgen container\"></div>');

  inline.insertAfter('header.page-header.cgen');

  $('body > section').each(function () {
    $(this).detach();
    $(this).appendTo(inline);
  });
  /* END .rash_inline */

  if (checkSoftware()) {

    showNavbar();

    $(messageDealer).hide()

    $(rash_inline_selector).setEditable()

    $(rash_inline_selector).addClass('mousetrap');
    $(rash_inline_selector).on('focus', function (event) {
      updateDropdown();
    });

    $('[data-toggle="tooltip"]').tooltip({
      placement: 'bottom',
      container: 'body'
    });

    rashEditor.init();

    //sortableAuthors()
    //EDITABLE meta
    attachHeaderEventHandler()

    updateModeButton()

    initFigureReferences()

    $('footer button.dropdown-toggle').addClass('disabled')

    bodyContent = $(rash_inline_selector).html()
  }
})

function attachHeaderEventHandler() {

  $(meta_headers_selector).on('dblclick', function () {
    if (checkLogin()) {
      $(this).attr('contenteditable', 'true')
      $(this).addClass('mousetrap')
    }
  })

  $(meta_headers_selector).on('focusout', function () {
    if (checkLogin()) {
      $(this).attr('contenteditable', 'false')
      $(this).addClass('mousetrap')
    }
  })

}

function updateEditState() {

  bodyContent = $(rash_inline_selector).html()
  edit_state = false

  //send edit state to main process
  setEditState()
}

function initFigureReferences() {
  $('figure:has(table)').each(function () {

    var id = 'table_' + $(this).attr('id').split('_')[1]
    window[id] = new rashEditor.Table(id)
    window[id].addOptions()
    addTableModal()
  })
}

function executeSave() {
  executeSaveAsync()
  updateEditState()
  showMessageDealer('Document saved', 'success', 2000)
}