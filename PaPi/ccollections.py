# -*- coding: utf-8

"""Implements the collections class (the file name has an extra 'c' to avoid
masking the standard collections library).

If the user have analyzed their metagenome using a metagenome binning software
and identified draft genomes in their data (or by any other means grouped their
contigs based on any criterion), this information can be stored in the
annotation database's collections_* tables. The class implemented here collects
this information from the database, and presents it as an intuitive data structure
for the client.
"""

from collections import Counter

import PaPi.db as db
import PaPi.fastalib as u
import PaPi.utils as utils
import PaPi.terminal as terminal

from PaPi.tables import *
from PaPi.utils import ConfigError
from PaPi.filesnpaths import FilesNPathsError


__author__ = "A. Murat Eren"
__copyright__ = "Copyright 2015, The PaPi Project"
__credits__ = []
__license__ = "GPL 3.0"
__version__ = "1.0.0"
__maintainer__ = "A. Murat Eren"
__email__ = "a.murat.eren@gmail.com"
__status__ = "Development"


run = terminal.Run()
progress = terminal.Progress()


def create_blank_collections_tables(db):
    db.create_table(collections_info_table_name, collections_info_table_structure, collections_info_table_types)
    db.create_table(collections_colors_table_name, collections_colors_table_structure, collections_colors_table_types)
    db.create_table(collections_contigs_table_name, collections_contigs_table_structure, collections_contigs_table_types)
    db.create_table(collections_splits_table_name, collections_splits_table_structure, collections_splits_table_types)


class Collections:
    def __init__(self, run = run, progress = progress):
        self.sources_dict = {}


    def populate_sources_dict(self, db_path, version):
        database = db.DB(db_path, version)
        db_type = database.get_meta_value('db_type')
        collections_info_table = database.get_table_as_dict(collections_info_table_name)
        database.disconnect()

        # collections info must be read only if its coming from the annotation database.
        if db_type == 'annotation':
            read_only = True
        elif db_type == 'profile':
            read_only = False
        else:
            raise ConfigError, 'Collections class does not know about this "%s" database type :/' % db_type

        for source in collections_info_table:
            self.sources_dict[source] = collections_info_table[source]
            self.sources_dict[source]['read_only'] = read_only
            self.sources_dict[source]['source_db_path'] = db_path
            self.sources_dict[source]['source_db_version'] = version


    def sanity_check(self, source):
        if source not in self.sources_dict:
            raise ConfigError, 'There is no "%s" I know of. Maybe the populate_sources_dict was not called\
                                for whatever database you are trying to get collections from? (PaPi asks this\
                                rhetorical question to the programmer).'


    def get_collection_dict(self, source):
        self.sanity_check(source)

        c = self.sources_dict[source]

        database = db.DB(c['source_db_path'], c['source_db_version'])
        collections_splits_table = database.get_table_as_dict(collections_splits_table_name)
        database.disconnect()

        # FIXME: this could be resolved with a WHERE clause in the SQL query:
        collection = utils.get_filtered_dict(collections_splits_table, 'source', set([source]))

        collection_dict = {}

        for entry in collection.values():
            source = entry['source']
            cluster_id = entry['cluster_id']
            split = entry['split']

            if collection_dict.has_key(cluster_id):
                collection_dict[cluster_id].append(split)
            else:
                collection_dict[cluster_id] = [split]

        return collection_dict


    def get_collection_colors(self, source):
        self.sanity_check(source)

        c = self.sources_dict[source]

        database = db.DB(c['source_db_path'], c['source_db_version'])
        collections_colors = database.get_table_as_dict(collections_colors_table_name)
        database.disconnect()

        # FIXME: this could be resolved with a WHERE clause in the SQL query:
        collection = utils.get_filtered_dict(collections_colors, 'source', set([source]))

        collection_color_dict = {}

        for entry in collection.values():
            collection_color_dict[entry['cluster_id']] = entry['htmlcolor']

        return collection_color_dict


class TablesForCollections(AnnotationDBTable):
    """Populates the collections_* tables, where clusters of contigs and splits are kept"""
    def __init__(self, db_path, version, run=run, progress=progress):
        self.db_path = db_path
        self.version = version

        AnnotationDBTable.__init__(self, self.db_path, version, run, progress)

        # set these dudes so we have access to unique IDs:
        self.set_next_available_id(collections_colors_table_name)
        self.set_next_available_id(collections_contigs_table_name)
        self.set_next_available_id(collections_splits_table_name)


    def append(self, source, clusters_dict, cluster_colors = None):
        # remove any pre-existing information for 'source'
        self.delete_entries_for_key('source', source, [collections_info_table_name, collections_contigs_table_name, collections_splits_table_name, collections_colors_table_name])

        splits_in_clusters_dict = set(v['split'] for v in clusters_dict.values())
        splits_only_in_clusters_dict = [c for c in splits_in_clusters_dict if c not in self.splits]
        splits_only_in_db = [c for c in self.splits if c not in splits_in_clusters_dict]

        if len(splits_only_in_clusters_dict):
            self.run.warning('%d of %d splits found in "%s" results are not in the database. This may be OK,\
                                      but you must be the judge of it. If this is somewhat surprising, please use caution\
                                      and make sure all is fine before going forward with you analysis.'\
                                            % (len(splits_only_in_clusters_dict), len(splits_in_clusters_dict), source))

        if len(splits_only_in_db):
            self.run.warning('%d of %d splits found in the database were missing from the "%s" results. If this\
                                      does not make any sense, please make sure you know why before going any further.'\
                                            % (len(splits_only_in_db), len(self.splits), source))

        database = db.DB(self.db_path, self.version)

        # how many clusters are defined in 'clusters_dict'?
        cluster_ids = set([v['cluster_id'] for v in clusters_dict.values()])

        # push information about this search result into serach_info table.
        db_entries = tuple([source, len(clusters_dict), len(cluster_ids)])
        database._exec('''INSERT INTO %s VALUES (?,?,?)''' % collections_info_table_name, db_entries)

        # populate colors table.
        if not cluster_colors:
            cluster_colors = utils.get_random_colors_dict(cluster_ids)
        db_entries = [(self.next_id(collections_colors_table_name), source, cid, cluster_colors[cid]) for cid in cluster_ids]
        database._exec_many('''INSERT INTO %s VALUES (?,?,?,?)''' % collections_colors_table_name, db_entries)

        # populate splits table
        db_entries = [tuple([self.next_id(collections_splits_table_name), source] + [v[h] for h in collections_splits_table_structure[2:]]) for v in clusters_dict.values()]
        database._exec_many('''INSERT INTO %s VALUES (?,?,?,?)''' % collections_splits_table_name, db_entries)

        # then populate contigs table.
        db_entries = self.process_contigs(source, clusters_dict)
        database._exec_many('''INSERT INTO %s VALUES (?,?,?,?)''' % collections_contigs_table_name, db_entries)

        database.disconnect()

        self.run.info('Collections', '%s annotations for %d splits have been successfully added to the annotation database.'\
                                        % (source, len(db_entries)), mc='green')


    def process_contigs(self, source, clusters_dict):
        db_entries_for_contigs = []

        split_to_cluster_id = dict([(d['split'], d['cluster_id']) for d in clusters_dict.values()])

        contigs_processed = set([])
        for split_name in split_to_cluster_id:
            if split_name not in self.splits:
                # which means this split only appears in the input file, but not in the database.
                continue

            contig_name = self.splits[split_name]['parent']

            if contig_name in contigs_processed:
                continue
            else:
                contigs_processed.add(contig_name)

            db_entry = tuple([self.next_id(collections_contigs_table_name), source, contig_name, split_to_cluster_id[split_name]])
            db_entries_for_contigs.append(db_entry)

        return db_entries_for_contigs