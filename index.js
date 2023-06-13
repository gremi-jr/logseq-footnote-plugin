import '@logseq/libs';
//TODO Problem das sich der Text löscht wenn zu schnell befehl geschrieben wird
  async function addFootnote (e) {
  
    //Need Vars
    var footnotesNumbers =0;
    var footnotearray = []
    var footnoteindex=0;
    var regexFootNoteIndex=/\[\^(\d+)\]/g
    var header = false;
    var headerUUID=""
    
    var normalPage = await getPageObject()
    let currentpageBlockTree = await logseq.Editor.getPageBlocksTree(normalPage.uuid)
    for (let i = 0; i < currentpageBlockTree.length; i++) {
      //check if header exists
      if(currentpageBlockTree[i].content == `## Footnotes`){
        header=true
        headerUUID = currentpageBlockTree[i].uuid
      }

      //Get index of footnote
      if(currentpageBlockTree[i].content.match(regexFootNoteIndex)){
        var str = currentpageBlockTree[i].content
        footnotesNumbers = getFirstRegexGroup(regexFootNoteIndex,str)
        footnotearray.push(parseInt(footnotesNumbers[0]))
      }
      // loop thourgh first children
      // Due to the indexes under the Footnoteheader we dont need to go deeper, because it will use the number under the footnote header
      if (currentpageBlockTree[i].children.length > 0) {
        for (let j = 0; j < currentpageBlockTree[i].children.length; j++) {
          if(currentpageBlockTree[i].children[j].content.match(regexFootNoteIndex)){
            var str = currentpageBlockTree[i].children[j].content
            footnotesNumbers = getFirstRegexGroup(regexFootNoteIndex, str)
            footnotearray.push(parseInt(footnotesNumbers[0]))
          }
        }
      }
    }

    if(footnotearray === undefined || footnotearray.length == 0 ){
      footnoteindex += 1
    }else{
      footnoteindex = Math.max.apply(Math, footnotearray) + 1
    }

    if(header == false){
      var normalPage = await getPageObject()
      await logseq.Editor.appendBlockInPage(normalPage.uuid, `## Footnotes`)
      //Because we need the Footnote header UUID in order to append the sources index we need to load again the PageBlocksTree
      let currentpageBlockTree = await logseq.Editor.getPageBlocksTree(normalPage.uuid)  
      for (let i = 0; i < currentpageBlockTree.length; i++) {
        if(currentpageBlockTree[i].content == `## Footnotes`){
          header=true
          headerUUID = currentpageBlockTree[i].uuid
        }
      }
    }

    //adding footnote to text
    const block = await logseq.Editor.getBlock(e.uuid)
    const newBlockText = block.content + "[^"+ footnoteindex +"]"
    logseq.Editor.updateBlock(e.uuid, newBlockText)

    //jup to footnotes header in order to place source
    const footNoteSourceText = "[^"+footnoteindex+"]: "
    await logseq.Editor.insertBlock(headerUUID, footNoteSourceText, {sibling: false})

  }

  function getFirstRegexGroup(regexp, str) {
    return Array.from(str.matchAll(regexp), m => m[1]);
  }

  async function getPageObject(){
    //Due to different pages/blocks (Journal/Subblocks/normal pages) we need different ways to get the id of the current page
    var normalPage = await logseq.Editor.getCurrentPage()
    if(normalPage != null && normalPage.hasOwnProperty("page")){
      normalPage = await logseq.Editor.getPage(normalPage.page.id)
    }else if(normalPage == null){
      var normalPage = await logseq.Editor.getCurrentBlock()
      normalPage = await logseq.Editor.getPage(normalPage.page.id)
    }
    return normalPage
  }

async function main() {
  console.log('plugin loaded');
  logseq.Editor.registerSlashCommand('Add Footnote', async (e) => {
    addFootnote(e)
  })
}

logseq.ready(main).catch(console.error);