const apiRoot = "https://api.github.com/";


// Return a HTTP query variable
function getQueryVariable(variable) {
    let query = window.location.search.substring(1);
    let vars = query.split("&");
    for(let i = 0; i < vars.length; i++) {
        let pair = vars[i].split("=");
        if(pair[0] == variable) {
            return pair[1];
        }
    }
    return "";
}

// Format numbers
function formatNumber(value) {
    return value.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,')
}

// Validate the user input
function validateInput() {
    if ($("#username").val().length > 0 && $("#repository").val().length > 0) {
        $("#get-stats-button").prop("disabled", false);
    } else {
        $("#get-stats-button").prop("disabled", true);
    }
}

// Move to #repository when hit enter and if it's empty or trigger the button
$("#username").keyup(function (event) {
    if (event.keyCode === 13) {
        if (!$("#repository").val()) {
            $("#repository").focus();
        } else {
            $("#get-stats-button").click();
        }
    }
});

// Callback function for getting user repositories
function getUserRepos() {
    let user = $("#username").val();
    let repository = $("#repository").val();

    let autoComplete = $('#repository').typeahead({ 
        autoSelect: true,
        afterSelect: function() {
            $("#get-stats-button").click();
        }
     });
    let repoNames = [];

    let url = apiRoot + "users/" + user + "/repos";
    $.getJSON(url, function(data) {
        $.each(data, function(index, item) {
            repoNames.push(item.name);
            if (item.name == repository){

                let html = "<div class='row repo-stats'>";
                html += "<h1><span class='glyphicon glyphicon-star'></span>&nbsp;&nbsp;<a href='" + item.html_url + "/stargazers' target='_blank'>Stargazers</a></h1>";
                html += "<span>" + formatNumber(item.stargazers_count) + "</span>";
                // html += "<h1><span class='glyphicon glyphicon-eye-open'></span>&nbsp;&nbsp;<a href='" + item.html_url + "' target='_blank'>Watchers</a></h1>";
                // html += "<span>" + formatNumber(item.watchers_count) + "</span>";
                html += "<h1><span class='glyphicon glyphicon-random'></span>&nbsp;&nbsp;<a href='" + item.html_url + "/forks' target='_blank'>Forks</a></h1>";
                html += "<span>" + formatNumber(item.forks_count) + "</span>";
                html += "<h1><span class='glyphicon glyphicon-bell'></span>&nbsp;&nbsp;<a href='" + item.html_url + "/issues' target='_blank'>Open issues</a></h1>";
                html += "<span>" + formatNumber(item.open_issues) + "</span>";
                html += "</div>";

                let repoDiv = $("#repo-result");
                console.log(repoDiv);
                repoDiv.hide();
                repoDiv.html(html);
                repoDiv.slideDown();
            }
        });
    });

    autoComplete.data('typeahead').source = repoNames;
}

// Display the stats
function showStats(data) {
    let err = false;
    let errMessage = '';

    if(data.status == 404) {
        err = true;
        errMessage = "The project does not exist!";
    }

    if(data.status == 403) {
        err = true;
        errMessage = "You've exceeded GitHub's rate limiting.<br />Please try again in about an hour.";
    }

    if(data.length == 0) {
        err = true;
        errMessage = getQueryVariable("page") > 1 ? "No more releases" : "There are no releases for this project";
    }

    let html = "";

    if(err) {
        html += "<div class='col-md-7 col-md-offset-3 alert alert-danger output'>" + errMessage + "</div>";
    } else {
        html += "<div class='col-md-7 col-md-offset-3 output'>";

        let isLatestRelease = getQueryVariable("page") == 1 ? true : false;
        let totalDownloadCount = 0;
        $.each(data, function(index, item) {
            let releaseTag = item.tag_name;
            let releaseBadge = "";
            let releaseClassNames = "release";
            let releaseURL = item.html_url;
            let isPreRelease = item.prerelease;
            let releaseAssets = item.assets;
            let releaseDownloadCount = 0;
            let releaseAuthor = item.author;
            let publishDate = item.published_at.split("T")[0];
            let comment = item.body;

            if(isPreRelease) {
                releaseBadge = "&nbsp;&nbsp;<span class='badge'>Pre-release</span>";
                releaseClassNames += " pre-release";
            } else if(isLatestRelease) {
                releaseBadge = "&nbsp;&nbsp;<span class='badge'>Latest release</span>";
                releaseClassNames += " latest-release";
                isLatestRelease = false;
            }

            let downloadInfoHTML = "";
            if(releaseAssets.length) {
                downloadInfoHTML += "<h4><span class='glyphicon glyphicon-download'></span>&nbsp;&nbsp;" +
                    "Download Info</h4>";

                downloadInfoHTML += "<table class='table table-hover table-sm'><thead><tr'><th>Asset</th><th style='min-width: 80px; width: 100px;'>Size</th><th style='min-width: 70px; width: 100px;'>Downloads</th><th style='min-width: 90px; width: 100px;'>Updated</th></tr></thead><tbody>";

                releaseAssets.sort((a1,a2) => a2.download_count - a1.download_count);
                $.each(releaseAssets, function(index, asset) {
                    let assetSize = (asset.size / 1048576.0).toFixed(2);
                    let lastUpdate = asset.updated_at.split("T")[0];

                    downloadInfoHTML += "<tr><td><a href='" + 
                        asset.browser_download_url + "'>" +asset.name + "</a></td><td>" + assetSize + "&nbsp;MiB</td><td>" +
                        " " + formatNumber(asset.download_count) + "</td><td>" + lastUpdate + "</td></tr>";

                    totalDownloadCount += asset.download_count;
                    releaseDownloadCount += asset.download_count;
                });

                downloadInfoHTML += "</tbody></table>";
            }

            html += "<div class='row " + releaseClassNames + "'><details>";

            html += "<summary><h3><span class='glyphicon glyphicon-tag'></span>&nbsp;&nbsp;" +
                "<a href='" + releaseURL + "' target='_blank'>" + releaseTag + "</a>" + releaseBadge;
            if(releaseDownloadCount) {
                html += "&nbsp;&nbsp;<small>Downloads: " + formatNumber(releaseDownloadCount) + "</small>";
            }
            html += "</h3></summary>";
            html += "<hr class='release-hr'>";
            html += "<h4><span class='glyphicon glyphicon-info-sign'></span>&nbsp;&nbsp;" +
                "Release Info</h4>";

            html += "<ul>";

            if(releaseDownloadCount) {
                html += "<li><span class='glyphicon glyphicon-download'></span>&nbsp;&nbsp;" +
                    "Downloads: " + formatNumber(releaseDownloadCount) + "</li>";
            }

            html += "<li><span class='glyphicon glyphicon-calendar'></span>&nbsp;&nbsp;" +
                "Published: " + publishDate;
            if (releaseAuthor) {
                html += "&nbsp; by <a href='" + releaseAuthor.html_url + "'>@" + releaseAuthor.login  +"</a>";
            }
            html += "</li>";
    
            if(comment) {
                html += "<li><details><summary><span class='glyphicon glyphicon-comment'></span>&nbsp;&nbsp;Details</summary><pre>" + comment + "</pre></details></li>";
            }
            
            html += "</ul>";

            html += downloadInfoHTML;

            html += "</details></div>";
        });

        if(totalDownloadCount) {
		    let url = "https://github.com/" + $("#username").val() + "/" + $("#repository").val();

            let totalHTML = "<div class='row total-downloads'>";
            totalHTML += "<h1><span class='glyphicon glyphicon-download'></span>&nbsp;&nbsp;<a href='" + url + "' target='_blank'>Total Downloads</a></h1>";
            totalHTML += "<span>" + formatNumber(totalDownloadCount) + "</span>";
            totalHTML += "</div>";

            html = totalHTML + html;
        }

        html += "</div>";
    }

    let resultDiv = $("#stats-result");
    resultDiv.hide();
    resultDiv.html(html);
    $("#loader-gif").hide();
    resultDiv.slideDown();
}

// Callback function for getting release stats
function getStats(page, perPage) {
    let user = $("#username").val();
    let repository = $("#repository").val();

    let url = apiRoot + "repos/" + user + "/" + repository + "/releases" +
        "?page=" + page + "&per_page=" + perPage;
    $.getJSON(url, showStats).fail(showStats);
}

// Redirection function
function redirect(page, perPage) {
    window.location = "?username=" + $("#username").val() +
        "&repository=" + $("#repository").val() +
        "&page=" + page + "&per_page=" + perPage +
        ((getQueryVariable("search") == "0") ? "&search=0" : "");
}

// The main function
$(function() {
    $("#loader-gif").hide();

    validateInput();
    $("#username, #repository").keyup(validateInput);

    $("#username").change(getUserRepos);

    $("#get-stats-button").click(function() {
        redirect(page, perPage);
    });

    $("#get-prev-results-button").click(function() {
        redirect(page > 1 ? --page : 1, perPage);
    });

    $("#get-next-results-button").click(function() {
        redirect(++page, perPage);
    });

    $("#per-page select").on('change', function() {
        if(username == "" && repository == "") return;
        redirect(page, this.value);
    });

    let username = getQueryVariable("username");
    let repository = getQueryVariable("repository");
    let showSearch = getQueryVariable("search");
    let page = getQueryVariable("page") || 1;
    let perPage = getQueryVariable("per_page") || 5;

    if(username != "" && repository != "") {
        $("#username").val(username);
        $("#title .username").text(username);
        $("#repository").val(repository);
        $("#title .repository").text(repository);
        $("#per-page select").val(perPage);
        validateInput();
        getUserRepos();
        $(".output").hide();
        $("#description").hide();
        $("#loader-gif").show();
        getStats(page, perPage);

        if(showSearch == "0") {
            $("#search").hide();
            $("#description").hide();
            $("#title").show();
        }
    } else {
        $("#username").focus();
    }
});
