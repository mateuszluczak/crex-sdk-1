const fs = require('fs');
const util = require('util');
const chalk = require('chalk');
const archiver = require('archiver');
const zip = archiver('zip');

const Base = require('./base');

module.exports = class Upload extends Base {
	async init() {
		const {
			compress,
			omit
		} = this.program;

		if (omit) {
			this.omit = omit;
		}

		this.spinner.start();

		if (compress) {
			await this.compressPackage();
		}

		const uploadedPackage = await this.uploadPackage();
		const installedPackage = await this.installPackage(uploadedPackage.packageId);
		this.reportEnd(uploadedPackage, 'installed');
		this.generateReport(installedPackage, uploadedPackage);

		this.cleanUp();
	}

	reportChanges(files, type, color) {
		files.forEach((file) => {
			console.log(`    ${chalk[color](util.format('%s %s', type + ': ', file))}`);
		});
	};
	
	reportEnd(packageInfo = {}, action) {
		this.reportSuccess(
			`Package %s ${action} on %s`, 
			[
				chalk.green(packageInfo.name),
				chalk.green(this.crex.getAddress())
			]
		)
	}

	generateReport(changes) {
		const ignored = changes.ignoredFiles.length;
		const removed = changes.removedFiles.length;
		const modified = changes.modifiedFiles.length;
		const added = changes.addedFiles.length;
	
		console.log();
		this.reportChanges(changes.removedFiles, 'removed', 'red');
		console.log(chalk.red(`✗ ${util.format(' %s removed files', removed)}`));
	
		console.log();
		this.reportChanges(changes.ignoredFiles, 'ignored', 'gray');
		console.log(chalk.gray(`○ ${util.format(' %s ignored files', ignored)}`));
	
		console.log();
		this.reportChanges(changes.modifiedFiles, 'modified', 'yellow');
		console.log(chalk.yellow(`⦿ ${util.format(' %s modified files', modified)}`));
	
		console.log();
		this.reportChanges(changes.addedFiles, 'added', 'green');
		console.log(chalk.green(`● ${util.format(' %s added files', added)}`));
	}

	compressPackage() {
		return new Promise((resolve, reject) => {
			const output = fs.createWriteStream(this.zipName);
			const { compress } = this.program;

			this.name = this.zipName;

			zip.pipe(output);
			zip.on('error', (err) => {
				this.spinner.fail(chalk.red(err));
				reject(err);
			});
			output.on('close', function() {
				resolve();
			});

			compress.forEach(folder => {
				const ignore = [...this.omit, `**/${this.zipName}`];

				zip.glob(`${folder}/**/*`, {
					cwd: (folder.charAt(0) === '/') ? folder : process.cwd(),
					dot: true,
					ignore
				});
			});

			zip.finalize();
		});
	}

	cleanUp() {
		if (this.program.compress) {
			this.spinner.text = this.spinnerLabels.cleaning;

			fs.unlink(this.zipName, (err) => {
				if (err) return;
			});
		}

		this.spinner.stop();
	}

	async uploadPackage() {
		this.spinner.text = util.format(
			this.spinnerLabels.uploading,
			chalk.green(this.crex.getAddress())
		);
		this.spinner.start();

		try {
			const request = await this.crex.uploadPackage({
				file: fs.createReadStream(this.name)
			});
			this.reportEnd(request, 'uploaded');

			return request;
		} catch (err) {
			this.reportFail(err);
		}
	}

	async installPackage(packageId) {
		this.spinner.text = this.spinnerLabels.installing;
		this.spinner.start();

		try {
			const request = await this.crex.installPackage({
				packageId, synchronous: true
			});

			return request;
		} catch (err) {
			this.reportFail(err);
		}
	}
}

