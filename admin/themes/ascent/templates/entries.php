<div id="subnav">
  <ul>
    <li><a href="<?php echo $app->urlFor("pages"); ?>">Pages</a></li>
    <li class="separator">&nbsp;</li>
    <?php foreach($listings as $listing): ?>
      <li><a href="entries?path=<?php echo $listing['slug']?>" <?php if ($listing['slug'] === $path): ?> class="active" <?php endif ?>><?php echo $listing['title'] ?></a></li>
    <?php endforeach ?>
  </ul>
</div>

<div class="container">

  <div id="status-bar">
    <div class="status-block">
      <span class="muted">Viewing all <?php echo Localization::fetch('entries', null, true)?> <?php echo Localization::fetch('in')?></span>
      <span class="folder">/<?php print $folder; ?>/</span>
    </div>
    <ul>
      <li>
        <a href="<?php echo $app->urlFor('publish')."?path={$path}&new=true"; ?>">
          <span class="ss-icon">add</span>
          <?php echo Localization::fetch('new_entry')?>
        </a>
      </li>
    </ul>
  </div>

  <form action="<?php print $app->urlFor('delete_entry')?>" action="POST">
    <div class="section">
      <table class="simple-table sortable">
        <thead>
          <tr>
            <th class="checkbox-col"></th>
            <th><div class="header-inner"><?php echo Localization::fetch('title')?></div></th>
            <?php if ($type == 'date'): ?>
              <th><div class="header-inner"><?php echo Localization::fetch('date')?></div></th>
            <?php elseif ($type == 'number'): ?>
              <th><div class="header-inner"><?php echo Localization::fetch('number')?></div></th>
            <?php endif; ?>
            <th style="width:80px"><div class="header-inner"><?php echo Localization::fetch('status')?></div></th>
          </tr>
        </thead>
        <tbody>

        <?php foreach ($entries as $slug => $entry): ?>
        <?php $status = isset($entry['status']) ? $entry['status'] : 'live'; ?>
          <tr>
            <td class="checkbox-col">
              <input type="checkbox" name="entries[]" value="<?php echo "{$path}/{$slug}" ?>" data-bind="checked: selectedEntries" >
            </td>

            <td class="title">
              <a href="<?php print $app->urlFor('publish')?>?path=<?php echo Path::tidy($path.'/')?><?php echo $slug ?>"><?php print (isset($entry['title']) && $entry['title'] <> '') ? $entry['title'] : Slug::prettify($entry['slug']) ?></a>
            </td>

            <?php if ($type == 'date'): ?>
              <td><?php print date("Y/m/d", strtotime(@$entry['date']))?></td>
            <?php elseif ($type == 'number'): ?>
              <td><?php print $entry['numeric'] ?></td>
            <?php endif ?>
            <td class="margin status status-<?php print $status ?>">
              <span class="ss-icon tip">record</span><?php print ucwords($status) ?>
            </td>
          </tr>
        <?php endforeach ?>
        </tbody>
      </table>
    </div>
    <div class="take-action clearfix">
      <div class="input-status block-action pull-left" data-bind="css: {disabled: selectedEntries().length < 1}">
        <div class="input-select-wrap">
          <select data-bind="enable: selectedEntries().length > 0, selectedOptions: selectedAction">
            <option value="">Take Action</option>
            <option value="delete">Delete Entries</option>
          </select>
        </div>
      </div>

      <input type="submit" class="btn pull-left" data-bind="visible: selectedAction() != '' && selectedEntries().length > 0" value="Yes, I'm Sure">
    </div>
  </form>

  </div>
</div>


<script type="text/javascript">
  var viewModel = {
      selectedEntries: ko.observableArray(),
      selectedAction: ko.observable(''),
  };

  viewModel.selectedEntries.subscribe(function(item){
    // console.log('selected ' + item);
  }, viewModel);

  viewModel.selectedAction.subscribe(function(action) {
    // console.log('selected ' + action);
  }, viewModel);

  ko.applyBindings(viewModel);

</script>